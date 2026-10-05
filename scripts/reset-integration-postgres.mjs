import { spawn } from "node:child_process";

const databaseUrl=process.env.LEGACY_DATABASE_URL ?? process.env.DATABASE_URL;
if(!databaseUrl) throw new Error("LEGACY_DATABASE_URL or DATABASE_URL is required");

const target=new URL(databaseUrl);
const databaseName=target.pathname.replace(/^\//,"");
if(!databaseName) throw new Error("database URL must include a database name");
if(databaseName==="postgres" || databaseName==="template0" || databaseName==="template1"){
  throw new Error("refusing to reset a system database");
}

const admin=new URL(databaseUrl);
admin.pathname="/postgres";

await run("psql",[
  admin.toString(),
  "-v","ON_ERROR_STOP=1",
  "-c",`DROP DATABASE IF EXISTS "${databaseName.replaceAll('"','""')}" WITH (FORCE);`,
  "-c",`CREATE DATABASE "${databaseName.replaceAll('"','""')}";`
]);

console.log(JSON.stringify({ok:true,resetDatabase:databaseName}));

function run(command,args){
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{stdio:"inherit"});
    child.once("error",reject);
    child.once("exit",code=>code===0?resolve():reject(new Error(`${command} exited with code ${code}`)));
  });
}
