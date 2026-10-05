import { spawn } from "node:child_process";
import { resolve } from "node:path";

const databaseUrl=process.env.LEGACY_DATABASE_URL ?? process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("LEGACY_DATABASE_URL or DATABASE_URL is required");

const input=process.argv[2];
if(!input) throw new Error("Usage: node scripts/restore-postgres.mjs <backup.dump>");
const file=resolve(input);

await new Promise((resolvePromise,reject)=>{
  const child=spawn("pg_restore",[
    "--clean","--if-exists","--no-owner","--no-acl","--dbname",databaseUrl,file
  ],{stdio:"inherit"});
  child.once("error",reject);
  child.once("exit",code=>code===0?resolvePromise():reject(new Error(`pg_restore exited with code ${code}`)));
});

console.log(JSON.stringify({ok:true,input:file}));
