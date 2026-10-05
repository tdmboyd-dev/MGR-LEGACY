import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { PostgresDatabase, MigrationRunner } from "@mgr/legacy-database";
import { createLegacyServer } from "./http.js";
import { DefaultLegacyApiServices } from "./services.js";

export interface BootstrapResult {
  port:number;
  migrations:string[];
}

export async function bootstrapLegacyApi():Promise<BootstrapResult>{
  const databaseUrl=process.env.LEGACY_DATABASE_URL ?? process.env.DATABASE_URL;
  if(!databaseUrl) throw new Error("LEGACY_DATABASE_URL or DATABASE_URL is required");

  const port=Number(process.env.LEGACY_PORT ?? process.env.PORT ?? 8787);
  const token=process.env.LEGACY_API_TOKEN;
  const defaultTenantId=process.env.LEGACY_DEFAULT_TENANT_ID;
  const ssl=String(process.env.LEGACY_DATABASE_SSL ?? "false").toLowerCase()==="true";

  const db=new PostgresDatabase(databaseUrl,{ssl});
  const here=dirname(fileURLToPath(import.meta.url));
  const migrationsDir=resolve(here,"../../database/migrations");
  const migrations=await new MigrationRunner(db,migrationsDir).runPending();

  const services=new DefaultLegacyApiServices(db,defaultTenantId);
  const server=createLegacyServer(services,{bearerToken:token});

  await new Promise<void>((resolvePromise,reject)=>{
    server.once("error",reject);
    server.listen(port,()=>{
      server.off("error",reject);
      resolvePromise();
    });
  });

  const shutdown=async()=>{
    server.close();
    await db.close();
  };

  process.once("SIGTERM",()=>{void shutdown();});
  process.once("SIGINT",()=>{void shutdown();});

  return {port,migrations};
}

if(import.meta.url===`file://${process.argv[1]}`){
  bootstrapLegacyApi()
    .then(({port,migrations})=>{
      console.log(JSON.stringify({
        service:"mgr-legacy-api",
        status:"listening",
        port,
        migrationsApplied:migrations
      }));
    })
    .catch(error=>{
      console.error(error);
      process.exitCode=1;
    });
}
