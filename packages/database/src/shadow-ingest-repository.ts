import type { SqlExecutor } from "./sql.js";

export interface ShadowIngestRecord {
  sourceSystem:string;
  action:string;
  tenantId?:string;
  userId?:string;
  sourceId?:string;
  correlationId?:string;
  payload:Record<string,unknown>;
  metadata:Record<string,unknown>;
}

export class PostgresShadowIngestRepository {
  constructor(private readonly db:SqlExecutor){}

  async append(record:ShadowIngestRecord):Promise<number>{
    const result=await this.db.query<{id:string|number}>(
      `INSERT INTO shadow_ingest
       (source_system,action,tenant_id,user_id,source_id,correlation_id,payload,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb)
       RETURNING id`,
      [
        record.sourceSystem,record.action,record.tenantId ?? null,record.userId ?? null,
        record.sourceId ?? null,record.correlationId ?? null,
        JSON.stringify(record.payload),JSON.stringify(record.metadata)
      ]
    );
    return Number(result.rows[0]!.id);
  }

  async markReconciled(id:number,note?:string):Promise<void>{
    await this.db.query(
      "UPDATE shadow_ingest SET reconciled=true,reconciliation_note=$2 WHERE id=$1",
      [id,note ?? null]
    );
  }
}
