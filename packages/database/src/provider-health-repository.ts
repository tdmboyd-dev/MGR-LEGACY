import type {
  Channel,
  ProviderHealthSample,
  ProviderHealthStore,
  ProviderRoutingState
} from "@mgr/legacy-communications";
import type { SqlExecutor } from "./sql.js";

export class PostgresProviderHealthRepository implements ProviderHealthStore {
  constructor(private readonly db:SqlExecutor){}

  async record(sample:ProviderHealthSample):Promise<void>{
    await this.db.query(
      `INSERT INTO provider_health_samples
       (tenant_id,provider_key,channel,healthy,latency_ms,failure_count,details,observed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
      [
        sample.tenantId ?? null,
        sample.providerKey,
        sample.channel,
        sample.healthy,
        sample.latencyMs ?? null,
        sample.failureCount,
        JSON.stringify(sample.details ?? {}),
        sample.observedAt
      ]
    );
  }

  async getState(
    tenantId:string|undefined,
    providerKey:string,
    channel:Channel
  ):Promise<ProviderRoutingState|null>{
    const result=await this.db.query<any>(
      `SELECT * FROM provider_routing_state
       WHERE tenant_id IS NOT DISTINCT FROM $1
         AND provider_key=$2
         AND channel=$3
       LIMIT 1`,
      [tenantId ?? null,providerKey,channel]
    );

    const row=result.rows[0];
    return row ? {
      tenantId:row.tenant_id ?? undefined,
      providerKey:row.provider_key,
      channel:row.channel,
      priority:row.priority,
      enabled:row.enabled,
      consecutiveFailures:row.consecutive_failures,
      circuitState:row.circuit_state,
      openedAt:row.opened_at ? new Date(row.opened_at).toISOString() : undefined,
      updatedAt:new Date(row.updated_at).toISOString()
    } : null;
  }

  async saveState(state:ProviderRoutingState):Promise<void>{
    await this.db.query(
      `INSERT INTO provider_routing_state
       (tenant_id,provider_key,channel,priority,enabled,consecutive_failures,circuit_state,opened_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (tenant_id,provider_key,channel)
       DO UPDATE SET
         priority=EXCLUDED.priority,
         enabled=EXCLUDED.enabled,
         consecutive_failures=EXCLUDED.consecutive_failures,
         circuit_state=EXCLUDED.circuit_state,
         opened_at=EXCLUDED.opened_at,
         updated_at=EXCLUDED.updated_at`,
      [
        state.tenantId ?? null,
        state.providerKey,
        state.channel,
        state.priority,
        state.enabled,
        state.consecutiveFailures,
        state.circuitState,
        state.openedAt ?? null,
        state.updatedAt
      ]
    );
  }
}
