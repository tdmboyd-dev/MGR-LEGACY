import type { Signal } from "@mgr/legacy-intelligence";
import type { SqlExecutor } from "./sql.js";

export class PostgresSignalRepository {
  constructor(private readonly db:SqlExecutor){}

  async upsert(signal:Signal):Promise<void>{
    await this.db.query(
      `INSERT INTO signals
       (id,tenant_id,subject_type,subject_id,signal_key,value,confidence,source,observed_at,expires_at,evidence)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11::jsonb)
       ON CONFLICT (id) DO UPDATE SET value=EXCLUDED.value,confidence=EXCLUDED.confidence,
       observed_at=EXCLUDED.observed_at,expires_at=EXCLUDED.expires_at,evidence=EXCLUDED.evidence`,
      [
        signal.id,signal.tenantId,signal.subjectType,signal.subjectId,signal.key,JSON.stringify(signal.value),
        signal.confidence,signal.source,signal.observedAt,signal.expiresAt ?? null,JSON.stringify(signal.evidence ?? {})
      ]
    );
  }

  async list(tenantId:string,subjectType:string,subjectId:string):Promise<Signal[]>{
    const result=await this.db.query<any>(
      `SELECT * FROM signals
       WHERE tenant_id=$1 AND subject_type=$2 AND subject_id=$3
         AND (expires_at IS NULL OR expires_at>now())
       ORDER BY observed_at DESC`,
      [tenantId,subjectType,subjectId]
    );
    return result.rows.map(row=>({
      id:row.id,tenantId:row.tenant_id,subjectType:row.subject_type,subjectId:row.subject_id,
      key:row.signal_key,value:row.value,confidence:Number(row.confidence),source:row.source,
      observedAt:new Date(row.observed_at).toISOString(),
      expiresAt:row.expires_at?new Date(row.expires_at).toISOString():undefined,
      evidence:row.evidence ?? {}
    }));
  }
}
