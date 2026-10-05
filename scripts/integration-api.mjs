import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { PostgresDatabase, MigrationRunner } from "../packages/database/dist/index.js";
import { DefaultLegacyApiServices } from "../packages/api/dist/services.js";
import { createLegacyServer } from "../packages/api/dist/http.js";

const databaseUrl=process.env.LEGACY_DATABASE_URL ?? process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("LEGACY_DATABASE_URL or DATABASE_URL is required");

const db=new PostgresDatabase(databaseUrl);
const token="integration-token";
let server;

try{
  const runner=new MigrationRunner(db,resolve(process.cwd(),"packages/database/migrations"));
  await runner.runPending();

  const tenantA=randomUUID();
  const tenantB=randomUUID();
  await db.query(
    "INSERT INTO tenants (id,name,slug) VALUES ($1,$2,$3),($4,$5,$6)",
    [
      tenantA,"API Tenant A",`api-a-${tenantA}`,
      tenantB,"API Tenant B",`api-b-${tenantB}`
    ]
  );

  server=createLegacyServer(new DefaultLegacyApiServices(db),{bearerToken:token});
  await new Promise((resolveListen,reject)=>{
    server.once("error",reject);
    server.listen(0,"127.0.0.1",resolveListen);
  });

  const address=server.address();
  if(!address || typeof address==="string") throw new Error("API did not bind to TCP port");
  const base=`http://127.0.0.1:${address.port}`;

  const health=await fetch(`${base}/health`);
  assert.equal(health.status,200);

  const unauthorized=await fetch(`${base}/v1/truth/summary`,{
    headers:{"x-tenant-id":tenantA}
  });
  assert.equal(unauthorized.status,401);

  const correlationId=randomUUID();
  const command=await fetch(`${base}/v1/commands`,{
    method:"POST",
    headers:{
      authorization:`Bearer ${token}`,
      "content-type":"application/json",
      "x-tenant-id":tenantA
    },
    body:JSON.stringify({
      action:"crm.create_contact",
      payload:{firstName:"API",lastName:"TenantA"},
      metadata:{
        userId:"api-integration",
        correlationId,
        idempotencyKey:`api:${correlationId}`
      }
    })
  });
  assert.equal(command.status,200);
  const commandBody=await command.json();
  assert.equal(commandBody.accepted,true);
  assert.equal(typeof commandBody.receiptId,"string");
  assert.equal(commandBody.correlationId,correlationId);

  const tenantASummary=await fetch(
    `${base}/v1/truth/summary?correlationId=${encodeURIComponent(correlationId)}`,
    {headers:{authorization:`Bearer ${token}`,"x-tenant-id":tenantA}}
  );
  assert.equal(tenantASummary.status,200);
  const tenantABody=await tenantASummary.json();
  assert.equal(tenantABody.total,1);
  assert.equal(tenantABody.succeeded,1);

  const tenantBSummary=await fetch(
    `${base}/v1/truth/summary?correlationId=${encodeURIComponent(correlationId)}`,
    {headers:{authorization:`Bearer ${token}`,"x-tenant-id":tenantB}}
  );
  assert.equal(tenantBSummary.status,200);
  const tenantBBody=await tenantBSummary.json();
  assert.equal(tenantBBody.total,0,"tenant B must not see tenant A receipt");

  const invalidJson=await fetch(`${base}/v1/commands`,{
    method:"POST",
    headers:{
      authorization:`Bearer ${token}`,
      "content-type":"application/json",
      "x-tenant-id":tenantA
    },
    body:"{not-json"
  });
  assert.equal(invalidJson.status,400);

  const spoofedMetadata=await fetch(`${base}/v1/commands`,{
    method:"POST",
    headers:{
      authorization:`Bearer ${token}`,
      "content-type":"application/json",
      "x-tenant-id":tenantA
    },
    body:JSON.stringify({
      action:"crm.create_contact",
      payload:{firstName:"HeaderWins"},
      metadata:{
        tenantId:tenantB,
        userId:"spoof-test",
        correlationId:randomUUID(),
        idempotencyKey:`spoof-meta:${randomUUID()}`
      }
    })
  });
  assert.equal(spoofedMetadata.status,200);

  const tenantBCountAfterSpoof=await db.query(
    "SELECT count(*)::int AS count FROM entities WHERE tenant_id=$1 AND entity_type='person'",
    [tenantB]
  );
  assert.equal(Number(tenantBCountAfterSpoof.rows[0]?.count),0,"body metadata tenant must not override request tenant");

  const canonicalSpoof=await fetch(`${base}/v1/commands`,{
    method:"POST",
    headers:{
      authorization:`Bearer ${token}`,
      "content-type":"application/json",
      "x-tenant-id":tenantA
    },
    body:JSON.stringify({
      commandId:randomUUID(),
      action:"crm.create_contact",
      actor:{actorType:"service",actorId:"spoof",tenantId:tenantB},
      scope:{tenantId:tenantB,scopeType:"organization",scopeId:tenantB},
      payload:{firstName:"ShouldFail"},
      idempotencyKey:`spoof-canonical:${randomUUID()}`,
      correlationId:randomUUID()
    })
  });
  assert.equal(canonicalSpoof.status,403);

  const missingOwner=await fetch(`${base}/v1/today`,{
    headers:{authorization:`Bearer ${token}`,"x-tenant-id":tenantA}
  });
  assert.equal(missingOwner.status,400);

  const rowsA=await db.query(
    "SELECT count(*)::int AS count FROM entities WHERE tenant_id=$1 AND entity_type='person'",
    [tenantA]
  );
  const rowsB=await db.query(
    "SELECT count(*)::int AS count FROM entities WHERE tenant_id=$1 AND entity_type='person'",
    [tenantB]
  );
  assert.equal(Number(rowsA.rows[0]?.count),1);
  assert.equal(Number(rowsB.rows[0]?.count),0);

  console.log(JSON.stringify({
    ok:true,
    tenantIsolation:true,
    auth:true,
    malformedJson400:true,
    correlationId,
    receiptId:commandBody.receiptId
  },null,2));
}finally{
  if(server){
    await new Promise(resolveClose=>server.close(()=>resolveClose()));
  }
  await db.close();
}
