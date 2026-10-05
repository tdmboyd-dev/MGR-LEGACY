import type { SqlExecutor } from "./sql.js";

export interface StoredExtension {
  tenantId?:string;
  id:string;
  version:string;
  status:"draft"|"active"|"disabled";
  manifest:Record<string,unknown>;
  installedAt:string;
}

export class PostgresExtensionRepository {
  constructor(private readonly db:SqlExecutor){}

  async install(value:StoredExtension):Promise<void>{
    await this.db.query(
      `INSERT INTO extension_installations
       (tenant_id,extension_id,version,status,manifest,installed_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6)
       ON CONFLICT (tenant_id,extension_id,version)
       DO UPDATE SET status=EXCLUDED.status,manifest=EXCLUDED.manifest`,
      [value.tenantId ?? null,value.id,value.version,value.status,JSON.stringify(value.manifest),value.installedAt]
    );
  }

  async list(tenantId?:string):Promise<StoredExtension[]>{
    const result=await this.db.query<any>(
      `SELECT * FROM extension_installations
       WHERE tenant_id IS NOT DISTINCT FROM $1
       ORDER BY extension_id,installed_at DESC`,
      [tenantId ?? null]
    );
    return result.rows.map(row=>({
      tenantId:row.tenant_id ?? undefined,
      id:row.extension_id,
      version:row.version,
      status:row.status,
      manifest:row.manifest ?? {},
      installedAt:new Date(row.installed_at).toISOString()
    }));
  }

  async registerWebhook(input:{
    tenantId?:string;
    extensionId:string;
    eventType:string;
    url:string;
  }):Promise<string>{
    const result=await this.db.query<{id:string}>(
      `INSERT INTO extension_webhooks
       (tenant_id,extension_id,event_type,url)
       VALUES ($1,$2,$3,$4)
       RETURNING id`,
      [input.tenantId ?? null,input.extensionId,input.eventType,input.url]
    );
    return result.rows[0]!.id;
  }
}
