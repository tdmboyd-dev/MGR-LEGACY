import type { LegacyEvent } from "@mgr/legacy-contracts";
import type { EventLedger } from "@mgr/legacy-core";
import type { SqlExecutor } from "./sql.js";

interface EventRow {
  event_id: string;
  event_type: string;
  event_version: number;
  occurred_at: string;
  actor_type: "user" | "agent" | "service";
  actor_id: string;
  tenant_id: string;
  scope_type: "organization" | "workspace" | "bureau" | "office" | "team" | "user" | "agent";
  scope_id: string;
  subject_type: LegacyEvent["subject"]["entityType"];
  subject_id: string;
  source: string;
  correlation_id: string;
  causation_id: string | null;
  idempotency_key: string;
  before_state: unknown;
  after_state: unknown;
  data: Record<string, unknown>;
  evidence: Record<string, unknown>;
}

function mapRow(row: EventRow): LegacyEvent {
  return {
    eventId: row.event_id,
    eventType: row.event_type,
    eventVersion: row.event_version,
    occurredAt: new Date(row.occurred_at).toISOString(),
    actor: {
      actorType: row.actor_type,
      actorId: row.actor_id,
      tenantId: row.tenant_id
    },
    scope: {
      tenantId: row.tenant_id,
      scopeType: row.scope_type,
      scopeId: row.scope_id
    },
    subject: {
      entityType: row.subject_type,
      entityId: row.subject_id
    },
    source: row.source,
    correlationId: row.correlation_id,
    causationId: row.causation_id ?? undefined,
    idempotencyKey: row.idempotency_key,
    before: row.before_state ?? undefined,
    after: row.after_state ?? undefined,
    data: row.data ?? {},
    evidence: row.evidence ?? {}
  };
}

export class PostgresEventLedger implements EventLedger {
  constructor(private readonly db: SqlExecutor) {}

  async append(event: LegacyEvent): Promise<void> {
    await this.db.query(
      `INSERT INTO event_ledger (
        event_id, tenant_id, scope_type, scope_id, event_type, event_version, occurred_at,
        actor_type, actor_id, subject_type, subject_id, source, correlation_id, causation_id,
        idempotency_key, before_state, after_state, data, evidence
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17::jsonb,$18::jsonb,$19::jsonb
      ) ON CONFLICT (tenant_id, idempotency_key) DO NOTHING`,
      [
        event.eventId, event.scope.tenantId, event.scope.scopeType, event.scope.scopeId,
        event.eventType, event.eventVersion, event.occurredAt,
        event.actor.actorType, event.actor.actorId, event.subject.entityType, event.subject.entityId,
        event.source, event.correlationId, event.causationId ?? null, event.idempotencyKey,
        JSON.stringify(event.before ?? null), JSON.stringify(event.after ?? null),
        JSON.stringify(event.data), JSON.stringify(event.evidence)
      ]
    );
  }

  async getById(eventId: string): Promise<LegacyEvent | null> {
    const result = await this.db.query<EventRow>(
      "SELECT * FROM event_ledger WHERE event_id = $1 LIMIT 1",
      [eventId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async listBySubject(entityType: string, entityId: string): Promise<LegacyEvent[]> {
    const result = await this.db.query<EventRow>(
      "SELECT * FROM event_ledger WHERE subject_type = $1 AND subject_id = $2 ORDER BY sequence_no",
      [entityType, entityId]
    );
    return result.rows.map(mapRow);
  }

  async listByCorrelation(correlationId: string): Promise<LegacyEvent[]> {
    const result = await this.db.query<EventRow>(
      "SELECT * FROM event_ledger WHERE correlation_id = $1 ORDER BY sequence_no",
      [correlationId]
    );
    return result.rows.map(mapRow);
  }
}
