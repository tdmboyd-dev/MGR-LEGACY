import type {
  AuditQueryPort,
  AuditRecord,
  RetentionPolicy,
  RetentionPolicyRepository
} from "@mgr/legacy-core";
import type { SqlExecutor } from "./sql.js";

export class PostgresAuditQueryRepository implements AuditQueryPort {
  constructor(private readonly db:SqlExecutor){}
  async list(input:Parameters<AuditQueryPort["list"]>[0]):Promise<AuditRecord[]>{
    const clauses=["tenant_id=$1"];
    const params:any[]=[input.tenantId];
    const add=(sql:string,value:any)=>{params.push(value);clauses.push(sql.replace("?",`$${params.length}`));};
    if(input.actorId) add("actor_id=?",input.actorId);
    if(input.resourceType) add("resource_type=?",input.resourceType);
    if(input.resourceId) add("resource_id=?",input.resourceId);
    if(input.action) add("action=?",input.action);
    if(input.from) add("created_at>=?",input.from);
    if(input.to) add("created_at<=?",input.to);
    params.push(input.limit ?? 200);
    const result=await this.db.query<any>(
      `SELECT * FROM audit_entries WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC LIMIT $${params.length}`,
      params
    );
    return result.rows.map(row=>({
      id:Number(row.id),tenantId:row.tenant_id,actorType:row.actor_type,actorId:row.actor_id,
      action:row.action,resourceType:row.resource_type,resourceId:row.resource_id ?? undefined,
      decision:row.decision,reason:row.reason ?? undefined,correlationId:row.correlation_id ?? undefined,
      evidence:row.evidence ?? {},createdAt:new Date(row.created_at).toISOString()
    }));
  }
}

export class PostgresRetentionPolicyRepository implements RetentionPolicyRepository {
  constructor(private readonly db:SqlExecutor){}
  async upsert(policy:RetentionPolicy):Promise<void>{
    await this.db.query(
      `INSERT INTO retention_policies
       (tenant_id,resource_type,retention_days,archive_after_days,delete_after_days,legal_hold)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (tenant_id,resource_type)
       DO UPDATE SET retention_days=EXCLUDED.retention_days,archive_after_days=EXCLUDED.archive_after_days,
       delete_after_days=EXCLUDED.delete_after_days,legal_hold=EXCLUDED.legal_hold,updated_at=now()`,
      [policy.tenantId,policy.resourceType,policy.retentionDays,policy.archiveAfterDays ?? null,policy.deleteAfterDays ?? null,policy.legalHold]
    );
  }
  async get(tenantId:string,resourceType:string):Promise<RetentionPolicy|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM retention_policies WHERE tenant_id=$1 AND resource_type=$2 LIMIT 1",
      [tenantId,resourceType]
    );
    const row=result.rows[0];
    return row ? {
      tenantId:row.tenant_id,resourceType:row.resource_type,retentionDays:row.retention_days,
      archiveAfterDays:row.archive_after_days ?? undefined,deleteAfterDays:row.delete_after_days ?? undefined,
      legalHold:row.legal_hold
    } : null;
  }
}
