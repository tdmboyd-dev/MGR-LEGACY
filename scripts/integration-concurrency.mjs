import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { PostgresDatabase, MigrationRunner } from "../packages/database/dist/index.js";
import { DefaultLegacyApiServices } from "../packages/api/dist/services.js";
import { createLegacyServer } from "../packages/api/dist/http.js";

const databaseUrl=process.env.LEGACY_DATABASE_URL ?? process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("LEGACY_DATABASE_URL or DATABASE_URL is required");

const db=new PostgresDatabase(databaseUrl);
let server;

try{
  await new MigrationRunner(db,resolve(process.cwd(),"packages/database/migrations")).runPending();

  const tenantId=randomUUID();
  await db.query(
    "INSERT INTO tenants (id,name,slug) VALUES ($1,$2,$3)",
    [tenantId,"Concurrency Tenant",`concurrency-${tenantId}`]
  );

  const token="concurrency-token";
  server=createLegacyServer(new DefaultLegacyApiServices(db),{bearerToken:token});
  await new Promise((resolveListen,reject)=>{
    server.once("error",reject);
    server.listen(0,"127.0.0.1",resolveListen);
  });
  const address=server.address();
  if(!address || typeof address==="string") throw new Error("API did not bind");
  const base=`http://127.0.0.1:${address.port}`;

  const correlationId=randomUUID();
  const idempotencyKey=`race:${randomUUID()}`;
  const requestBody=JSON.stringify({
    action:"crm.create_contact",
    payload:{firstName:"Race",lastName:"Protected"},
    metadata:{
      userId:"race-test",
      correlationId,
      idempotencyKey
    }
  });

  const attempts=20;
  const responses=await Promise.all(
    Array.from({length:attempts},()=>fetch(`${base}/v1/commands`,{
      method:"POST",
      headers:{
        authorization:`Bearer ${token}`,
        "content-type":"application/json",
        "x-tenant-id":tenantId
      },
      body:requestBody
    }))
  );

  const statuses=responses.map(response=>response.status);
  assert.ok(statuses.includes(200),"at least one request must succeed");
  assert.ok(statuses.every(status=>status===200 || status===409),"duplicates must resolve as replay/success or in-progress conflict");

  const entities=await db.query(
    "SELECT count(*)::int AS count FROM entities WHERE tenant_id=$1 AND entity_type='person'",
    [tenantId]
  );
  const events=await db.query(
    "SELECT count(*)::int AS count FROM event_ledger WHERE tenant_id=$1 AND idempotency_key=$2",
    [tenantId,idempotencyKey]
  );
  const idempotency=await db.query(
    "SELECT count(*)::int AS count FROM idempotency_keys WHERE tenant_id=$1 AND idempotency_key=$2",
    [tenantId,idempotencyKey]
  );

  assert.equal(Number(entities.rows[0]?.count),1,"concurrent duplicate delivery must create exactly one contact");
  assert.equal(Number(events.rows[0]?.count),1,"concurrent duplicate delivery must create exactly one event");
  assert.equal(Number(idempotency.rows[0]?.count),1,"concurrent duplicate delivery must reserve one idempotency record");

  const healthStarted=performance.now();
  const healthResponses=await Promise.all(
    Array.from({length:200},()=>fetch(`${base}/health`))
  );
  const healthElapsed=performance.now()-healthStarted;
  assert.ok(healthResponses.every(response=>response.status===200),"all concurrent health requests must pass");

  console.log(JSON.stringify({
    ok:true,
    duplicateAttempts:attempts,
    statuses,
    entityCount:Number(entities.rows[0]?.count),
    eventCount:Number(events.rows[0]?.count),
    idempotencyCount:Number(idempotency.rows[0]?.count),
    healthRequests:healthResponses.length,
    healthElapsedMs:Number(healthElapsed.toFixed(2)),
    healthRequestsPerSecond:Number((healthResponses.length/(healthElapsed/1000)).toFixed(2))
  },null,2));
}finally{
  if(server) await new Promise(resolveClose=>server.close(()=>resolveClose()));
  await db.close();
}
