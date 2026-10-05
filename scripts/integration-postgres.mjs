import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { PostgresDatabase, MigrationRunner } from "../packages/database/dist/index.js";
import { DefaultLegacyApiServices } from "../packages/api/dist/services.js";

const databaseUrl=process.env.LEGACY_DATABASE_URL ?? process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("LEGACY_DATABASE_URL or DATABASE_URL is required");

const db=new PostgresDatabase(databaseUrl);

try{
  const runner=new MigrationRunner(db,resolve(process.cwd(),"packages/database/migrations"));
  const appliedNow=await runner.runPending();
  const applied=await runner.applied();

  assert.equal(applied.size,17,"expected all 17 migrations to be applied");

  const tenantId=randomUUID();
  await db.query(
    "INSERT INTO tenants (id,name,slug) VALUES ($1,$2,$3)",
    [tenantId,"Integration Tenant",`integration-${tenantId}`]
  );

  const services=new DefaultLegacyApiServices(db,tenantId);
  const correlationId=randomUUID();
  const idempotencyKey=`integration:${randomUUID()}`;

  const result=await services.executeCommand({
    action:"crm.create_contact",
    payload:{
      firstName:"Integration",
      lastName:"Contact",
      email:"integration@example.test"
    },
    metadata:{
      tenantId,
      userId:"integration-test",
      correlationId,
      idempotencyKey
    }
  });

  assert.equal(result.accepted,true);
  assert.equal(typeof result.receiptId,"string");
  assert.equal(result.correlationId,correlationId);

  const receipts=await services.listActionReceipts({correlationId},tenantId);
  assert.equal(receipts.length,1);
  assert.equal(receipts[0]?.status,"succeeded");
  assert.equal(receipts[0]?.action,"crm.create_contact");

  const truth=await services.truthSummary({correlationId},tenantId);
  assert.equal(truth.total,1);
  assert.equal(truth.succeeded,1);
  assert.equal(truth.failed,0);

  const replay=await services.executeCommand({
    action:"crm.create_contact",
    payload:{
      firstName:"Integration",
      lastName:"Contact",
      email:"integration@example.test"
    },
    metadata:{
      tenantId,
      userId:"integration-test",
      correlationId,
      idempotencyKey
    }
  });

  assert.equal(replay.replayed,true);

  const contactRows=await db.query(
    "SELECT count(*)::int AS count FROM entities WHERE tenant_id=$1 AND entity_type='person'",
    [tenantId]
  );
  assert.equal(Number(contactRows.rows[0]?.count),1,"idempotent replay must not duplicate contact");

  console.log(JSON.stringify({
    ok:true,
    migrationsAppliedThisRun:appliedNow.length,
    totalMigrations:applied.size,
    tenantId,
    correlationId,
    receiptId:result.receiptId,
    truth
  },null,2));
}finally{
  await db.close();
}
