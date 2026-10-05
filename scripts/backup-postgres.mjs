import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const databaseUrl=process.env.LEGACY_DATABASE_URL ?? process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("LEGACY_DATABASE_URL or DATABASE_URL is required");

const output=resolve(process.argv[2] ?? `backups/mgr-legacy-${new Date().toISOString().replaceAll(":","-")}.dump`);
await mkdir(resolve(output,".."),{recursive:true});

await new Promise((resolvePromise,reject)=>{
  const child=spawn("pg_dump",["--format=custom","--no-owner","--no-acl","--file",output,databaseUrl],{stdio:"inherit"});
  child.once("error",reject);
  child.once("exit",code=>code===0?resolvePromise():reject(new Error(`pg_dump exited with code ${code}`)));
});

console.log(JSON.stringify({ok:true,output}));
