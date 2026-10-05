import type { MetricSample, ObservabilitySink, StructuredLog } from "@mgr/legacy-core";
import type { SqlExecutor } from "./sql.js";

export class PostgresObservabilitySink implements ObservabilitySink {
  constructor(private readonly db:SqlExecutor){}

  async log(entry:StructuredLog):Promise<void>{
    await this.db.query(
      `INSERT INTO structured_logs
       (level,message,tenant_id,correlation_id,actor_id,component,data,at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
      [
        entry.level,entry.message,entry.tenantId ?? null,entry.correlationId ?? null,
        entry.actorId ?? null,entry.component ?? null,JSON.stringify(entry.data),entry.at
      ]
    );
  }

  async metric(sample:MetricSample):Promise<void>{
    await this.db.query(
      `INSERT INTO metric_samples (name,value,unit,tenant_id,labels,at)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6)`,
      [sample.name,sample.value,sample.unit,sample.tenantId ?? null,JSON.stringify(sample.labels),sample.at]
    );
  }
}
