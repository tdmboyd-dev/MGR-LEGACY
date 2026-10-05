import type {
  ApprovalRequest,
  TraceEntry,
  TraceRepository
} from "@mgr/legacy-workflow";
import type { SqlExecutor } from "./sql.js";

export class PostgresApprovalRepository {
  constructor(private readonly db:SqlExecutor){}

  async create(request:ApprovalRequest):Promise<void>{
    await this.db.query(
      `INSERT INTO workflow_approval_requests
       (id,tenant_id,run_id,node_id,requested_by,approver_roles,minimum_approvals,status,approvals,denials,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        request.id,request.tenantId,request.runId,request.nodeId,request.requestedBy,
        request.approverRoles,request.minimumApprovals,request.status,request.approvals,
        request.denials,request.createdAt
      ]
    );
  }

  async get(id:string):Promise<ApprovalRequest|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM workflow_approval_requests WHERE id=$1 LIMIT 1",
      [id]
    );
    const row=result.rows[0];
    return row ? {
      id:row.id,tenantId:row.tenant_id,runId:row.run_id,nodeId:row.node_id,
      requestedBy:row.requested_by,approverRoles:row.approver_roles ?? [],
      minimumApprovals:row.minimum_approvals,status:row.status,approvals:row.approvals ?? [],
      denials:row.denials ?? [],createdAt:new Date(row.created_at).toISOString()
    } : null;
  }

  async save(request:ApprovalRequest):Promise<void>{
    await this.db.query(
      `UPDATE workflow_approval_requests
       SET status=$2,approvals=$3,denials=$4,updated_at=now()
       WHERE id=$1`,
      [request.id,request.status,request.approvals,request.denials]
    );
  }
}

export class PostgresTraceRepository implements TraceRepository {
  constructor(private readonly db:SqlExecutor){}

  async append(entry:TraceEntry):Promise<void>{
    await this.db.query(
      `INSERT INTO workflow_trace_entries
       (run_id,node_id,event,attempt,at,duration_ms,input,output,error,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10::jsonb)`,
      [
        entry.runId,entry.nodeId,entry.event,entry.attempt,entry.at,entry.durationMs ?? null,
        JSON.stringify(entry.input ?? null),JSON.stringify(entry.output ?? null),
        entry.error ?? null,JSON.stringify(entry.metadata)
      ]
    );
  }

  async list(runId:string):Promise<TraceEntry[]>{
    const result=await this.db.query<any>(
      "SELECT * FROM workflow_trace_entries WHERE run_id=$1 ORDER BY at,id",
      [runId]
    );
    return result.rows.map(row=>({
      runId:row.run_id,nodeId:row.node_id,event:row.event,attempt:row.attempt,
      at:new Date(row.at).toISOString(),durationMs:row.duration_ms ?? undefined,
      input:row.input ?? undefined,output:row.output ?? undefined,error:row.error ?? undefined,
      metadata:row.metadata ?? {}
    }));
  }
}
