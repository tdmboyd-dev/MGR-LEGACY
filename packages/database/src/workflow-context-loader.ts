import type { WorkflowExecutionContext } from "@mgr/legacy-workflow";
import type { SqlExecutor } from "./sql.js";

export class PostgresWorkflowContextLoader {
  constructor(private readonly db:SqlExecutor){}

  async load(runId:string):Promise<WorkflowExecutionContext|null>{
    const result=await this.db.query<any>(
      "SELECT id,tenant_id,workflow_id,workflow_version,correlation_id,trigger_payload FROM workflow_runs WHERE id=$1 LIMIT 1",
      [runId]
    );

    const row=result.rows[0];
    if(!row) return null;

    return {
      tenantId:row.tenant_id,
      workflowId:row.workflow_id,
      workflowVersion:row.workflow_version,
      runId:row.id,
      correlationId:row.correlation_id,
      triggerPayload:row.trigger_payload ?? {}
    };
  }
}
