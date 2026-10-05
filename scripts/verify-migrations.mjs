import { resolve } from "node:path";
import { PostgresDatabase, MigrationRunner } from "../packages/database/dist/index.js";

const databaseUrl=process.env.LEGACY_DATABASE_URL ?? process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("LEGACY_DATABASE_URL or DATABASE_URL is required");

const ssl=String(process.env.LEGACY_DATABASE_SSL ?? "false").toLowerCase()==="true";
const db=new PostgresDatabase(databaseUrl,{ssl});

try{
  const migrationsDir=resolve(process.cwd(),"packages/database/migrations");
  const runner=new MigrationRunner(db,migrationsDir);
  const appliedBefore=await runner.applied();
  const appliedNow=await runner.runPending();
  const appliedAfter=await runner.applied();
  const tables=await db.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public'
    ORDER BY table_name
  `);
  console.log(JSON.stringify({
    ok:true,
    appliedBefore:[...appliedBefore],
    appliedNow,
    appliedAfter:[...appliedAfter],
    tableCount:tables.rowCount,
    tables:tables.rows.map(row=>row.table_name)
  },null,2));
}finally{
  await db.close();
}
