import type { SqlExecutor } from "./sql.js";

export type WorkflowRunStatus="queued"|"running"|"waiting"|"succeeded"|"failed"|"cancelled";

export interface StoredWorkflowRun {
  id:string;
  tenantId:string;
  workflowId:string;
  workflowVersion:number;
  correlationId:string;
  status:WorkflowRunStatus;
  triggerPayload:Record<string,unknown>;
  startedAt?:string;
  completedAt?:string;
  retries:number;
  cost:number;
  lastError?:string;
}

export class PostgresWorkflowRunRepository {
  constructor(private readonly db:SqlExecutor){}

  async create(run:StoredWorkflowRun):Promise<void>{
    await this.db.query(
      `INSERT INTO workflow_runs
       (id,tenant_id,workflow_id,workflow_version,correlation_id,status,trigger_payload,started_at,completed_at,retries,cost,last_error)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12)`,
      [
        run.id,run.tenantId,run.workflowId,run.workflowVersion,run.correlationId,run.status,
        JSON.stringify(run.triggerPayload),run.startedAt ?? null,run.completedAt ?? null,
        run.retries,run.cost,run.lastError ?? null
      ]
    );
  }

  async updateStatus(
    tenantId:string,
    id:string,
    status:WorkflowRunStatus,
    patch:{completedAt?:string;lastError?:string;retries?:number;cost?:number}={}
  ):Promise<void>{
    await this.db.query(
      `UPDATE workflow_runs SET
         status=$3,
         completed_at=COALESCE($4,completed_at),
         last_error=COALESCE($5,last_error),
         retries=COALESCE($6,retries),
         cost=COALESCE($7,cost)
       WHERE tenant_id=$1 AND id=$2`,
      [tenantId,id,status,patch.completedAt ?? null,patch.lastError ?? null,patch.retries ?? null,patch.cost ?? null]
    );
  }

  async listByWorkflow(tenantId:string,workflowId:string,limit=100):Promise<StoredWorkflowRun[]>{
    const result=await this.db.query<any>(
      `SELECT * FROM workflow_runs
       WHERE tenant_id=$1 AND workflow_id=$2
       ORDER BY created_at DESC
       LIMIT $3`,
      [tenantId,workflowId,limit]
    );
    return result.rows.map(row=>({
      id:row.id,
      tenantId:row.tenant_id,
      workflowId:row.workflow_id,
      workflowVersion:row.workflow_version,
      correlationId:row.correlation_id,
      status:row.status,
      triggerPayload:row.trigger_payload ?? {},
      startedAt:row.started_at ? new Date(row.started_at).toISOString() : undefined,
      completedAt:row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
      retries:row.retries,
      cost:Number(row.cost),
      lastError:row.last_error ?? undefined
    }));
  }
}
