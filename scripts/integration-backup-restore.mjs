import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PostgresDatabase, MigrationRunner } from "../packages/database/dist/index.js";
import { resolve } from "node:path";

const databaseUrl=process.env.LEGACY_DATABASE_URL ?? process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("LEGACY_DATABASE_URL or DATABASE_URL is required");

function run(command,args){
  return new Promise((resolveRun,reject)=>{
    const child=spawn(command,args,{stdio:"inherit"});
    child.once("error",reject);
    child.once("exit",code=>code===0?resolveRun():reject(new Error(`${command} exited with code ${code}`)));
  });
}

const backupFile=join(tmpdir(),`mgr-legacy-backup-${randomUUID()}.dump`);
const baselineSlug=`backup-baseline-${randomUUID()}`;
const mutationSlug=`backup-mutation-${randomUUID()}`;

let db=new PostgresDatabase(databaseUrl);

try{
  const runner=new MigrationRunner(db,resolve(process.cwd(),"packages/database/migrations"));
  await runner.runPending();

  await db.query(
    "INSERT INTO tenants (name,slug) VALUES ($1,$2)",
    ["Backup Baseline",baselineSlug]
  );
  await db.close();

  await run("pg_dump",[
    "--format=custom",
    "--no-owner",
    "--no-acl",
    "--file",backupFile,
    databaseUrl
  ]);

  db=new PostgresDatabase(databaseUrl);
  await db.query(
    "INSERT INTO tenants (name,slug) VALUES ($1,$2)",
    ["Post Backup Mutation",mutationSlug]
  );
  await db.close();

  await run("pg_restore",[
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-acl",
    "--exit-on-error",
    "--dbname",databaseUrl,
    backupFile
  ]);

  db=new PostgresDatabase(databaseUrl);
  const baseline=await db.query(
    "SELECT count(*)::int AS count FROM tenants WHERE slug=$1",
    [baselineSlug]
  );
  const mutation=await db.query(
    "SELECT count(*)::int AS count FROM tenants WHERE slug=$1",
    [mutationSlug]
  );
  const migrations=await db.query(
    "SELECT count(*)::int AS count FROM legacy_migrations"
  );

  assert.equal(Number(baseline.rows[0]?.count),1,"baseline data must survive restore");
  assert.equal(Number(mutation.rows[0]?.count),0,"post-backup mutation must disappear after restore");
  assert.equal(Number(migrations.rows[0]?.count),17,"all migration records must survive restore");

  console.log(JSON.stringify({
    ok:true,
    baselineRestored:true,
    postBackupMutationRemoved:true,
    migrationCount:Number(migrations.rows[0]?.count)
  },null,2));
}finally{
  try{await db.close();}catch{}
  await rm(backupFile,{force:true});
}
