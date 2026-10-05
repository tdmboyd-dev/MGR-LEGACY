import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { copyFile, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { PostgresDatabase, MigrationRunner } from "../packages/database/dist/index.js";

const databaseUrl=process.env.LEGACY_DATABASE_URL ?? process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("LEGACY_DATABASE_URL or DATABASE_URL is required");

const db=new PostgresDatabase(databaseUrl);
const temp=await mkdtemp(join(tmpdir(),"mgr-legacy-migrations-"));
const allDir=resolve(process.cwd(),"packages/database/migrations");

try{
  const files=(await readdir(allDir)).filter(name=>/^\d+.*\.sql$/.test(name)).sort();
  assert.equal(files.length,17,"expected 17 migration files");

  const phaseOne=files.filter(name=>Number(name.slice(0,4))<=7);
  assert.equal(phaseOne.length,7,"expected migrations 0001-0007 in phase one");

  for(const name of phaseOne){
    await copyFile(join(allDir,name),join(temp,basename(name)));
  }

  const firstRunner=new MigrationRunner(db,temp);
  const firstApplied=await firstRunner.runPending();
  assert.equal(firstApplied.length,7);

  const tenantId=randomUUID();
  const entityId=randomUUID();
  await db.query(
    "INSERT INTO tenants (id,name,slug) VALUES ($1,$2,$3)",
    [tenantId,"Upgrade Tenant",`upgrade-${tenantId}`]
  );
  await db.query(
    `INSERT INTO entities
     (id,tenant_id,entity_type,display_name,lifecycle_state,attributes)
     VALUES ($1,$2,'person',$3,'lead',$4::jsonb)`,
    [entityId,tenantId,"Pre Upgrade Contact",JSON.stringify({marker:"before-upgrade"})]
  );

  const fullRunner=new MigrationRunner(db,allDir);
  const secondApplied=await fullRunner.runPending();
  assert.equal(secondApplied.length,10,"expected migrations 0008-0017 in phase two");

  const applied=await fullRunner.applied();
  assert.equal(applied.size,17);

  const entity=await db.query(
    "SELECT id,tenant_id,display_name,attributes FROM entities WHERE id=$1 AND tenant_id=$2",
    [entityId,tenantId]
  );
  assert.equal(entity.rowCount,1);
  assert.equal(entity.rows[0]?.display_name,"Pre Upgrade Contact");
  assert.equal(entity.rows[0]?.attributes?.marker,"before-upgrade");

  const receiptTable=await db.query(
    "SELECT to_regclass('public.action_receipts') AS name"
  );
  assert.equal(receiptTable.rows[0]?.name,"action_receipts");

  const creationTable=await db.query(
    "SELECT to_regclass('public.creation_jobs') AS name"
  );
  assert.equal(creationTable.rows[0]?.name,"creation_jobs");

  console.log(JSON.stringify({
    ok:true,
    phaseOne:firstApplied,
    phaseTwo:secondApplied,
    totalApplied:applied.size,
    preservedEntityId:entityId
  },null,2));
}finally{
  await rm(temp,{recursive:true,force:true});
  await db.close();
}
