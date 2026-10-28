import type { LegacyEvent } from "@mgr/legacy-contracts";
import type { SqlExecutor } from "./sql.js";

export interface AuditWrite {
  tenantId: string;
  actorType: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  decision: string;
  reason?: string;
  correlationId: string;
  evidence?: Record<string, unknown>;
}

export class PostgresAuditStore {
  constructor(private readonly db: SqlExecutor) {}

  async append(entry: AuditWrite): Promise<void> {
    await this.db.query(
      `INSERT INTO audit_entries
       (tenant_id, actor_type, actor_id, action, resource_type, resource_id, decision, reason, correlation_id, evidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
      [
        entry.tenantId, entry.actorType, entry.actorId, entry.action, entry.resourceType,
        entry.resourceId ?? null, entry.decision, entry.reason ?? null, entry.correlationId,
        JSON.stringify(entry.evidence ?? {})
      ]
    );
  }
}

export class PostgresOutbox {
  constructor(private readonly db: SqlExecutor) {}

  async enqueue(event: LegacyEvent, topic = "legacy.events"): Promise<void> {
    const result=await this.db.query(
      `INSERT INTO outbox (event_id, topic, payload) VALUES ($1,$2,$3::jsonb)
       ON CONFLICT (event_id,topic) DO UPDATE SET payload=outbox.payload
       WHERE outbox.payload=EXCLUDED.payload RETURNING id`,
      [event.eventId, topic, JSON.stringify(event)]
    );
    if(result.rowCount!==1) throw new Error("Outbox idempotency conflict");
  }
}
