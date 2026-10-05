import type {
  ProviderIncidentSignal,
  WaitingWorkflowSignal
} from "@mgr/legacy-core";
import type { SqlExecutor } from "./sql.js";

export class PostgresOperationalTodayRepository {
  constructor(private readonly db:SqlExecutor){}

  async waitingWorkflows(ownerId:string,tenantId:string):Promise<WaitingWorkflowSignal[]>{
    const result=await this.db.query<any>(
      `SELECT DISTINCT ON (wr.id)
         wr.id AS run_id,
         wr.tenant_id,
         wr.workflow_id,
         wd.name AS workflow_name,
         wc.next_attempt_at,
         wc.error,
         wr.retries
       FROM workflow_runs wr
       JOIN workflow_definitions wd
         ON wd.tenant_id=wr.tenant_id
        AND wd.workflow_id=wr.workflow_id
        AND wd.version=wr.workflow_version
       JOIN workflow_checkpoints wc
         ON wc.run_id=wr.id
       WHERE wr.tenant_id=$1
         AND wr.status='waiting'
         AND (wr.trigger_payload->>'ownerId'=$2 OR wr.trigger_payload->>'owner_id'=$2)
       ORDER BY wr.id,wc.updated_at DESC`,
      [tenantId,ownerId]
    );

    return result.rows.map(row=>({
      runId:row.run_id,
      tenantId:row.tenant_id,
      ownerId,
      workflowName:row.workflow_name,
      subject:{entityType:"custom",entityId:`workflow:${row.workflow_id}`},
      retryAt:row.next_attempt_at ? new Date(row.next_attempt_at).toISOString() : undefined,
      lastError:row.error ?? undefined,
      retries:row.retries ?? 0
    }));
  }

  async providerIncidents(ownerId:string,tenantId:string):Promise<ProviderIncidentSignal[]>{
    const result=await this.db.query<any>(
      `SELECT tenant_id,provider_key,channel,consecutive_failures,circuit_state
       FROM provider_routing_state
       WHERE tenant_id=$1
         AND enabled=true
         AND (circuit_state<>'closed' OR consecutive_failures>0)
       ORDER BY
         CASE circuit_state WHEN 'open' THEN 0 WHEN 'half_open' THEN 1 ELSE 2 END,
         consecutive_failures DESC,
         provider_key`,
      [tenantId]
    );

    return result.rows.map(row=>({
      id:`${row.channel}:${row.provider_key}`,
      tenantId:row.tenant_id,
      ownerId,
      providerKey:row.provider_key,
      channel:row.channel,
      subject:{entityType:"custom",entityId:`provider:${row.provider_key}`},
      consecutiveFailures:row.consecutive_failures,
      circuitOpen:row.circuit_state==="open"
    }));
  }
}
