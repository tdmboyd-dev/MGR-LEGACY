import type { LegacyEvent } from "@mgr/legacy-contracts";
import type { EventLedger } from "@mgr/legacy-core";
import type { SqlExecutor, SqlDatabase } from "./sql.js";

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
    if(event.actor.tenantId!==event.scope.tenantId)throw new Error("Tenant mismatch");
    const values=[
        event.eventId, event.scope.tenantId, event.scope.scopeType, event.scope.scopeId,
        event.eventType, event.eventVersion, event.occurredAt,
        event.actor.actorType, event.actor.actorId, event.subject.entityType, event.subject.entityId,
        event.source, event.correlationId, event.causationId ?? null, event.idempotencyKey,
        JSON.stringify(event.before ?? null), JSON.stringify(event.after ?? null),
        JSON.stringify(event.data), JSON.stringify(event.evidence)
      ];
    const inserted=await this.db.query(
      `INSERT INTO event_ledger (
        event_id, tenant_id, scope_type, scope_id, event_type, event_version, occurred_at,
        actor_type, actor_id, subject_type, subject_id, source, correlation_id, causation_id,
        idempotency_key, before_state, after_state, data, evidence
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17::jsonb,$18::jsonb,$19::jsonb
      ) ON CONFLICT (tenant_id, idempotency_key) DO NOTHING`,
      values
    );
    if(inserted.rowCount===0){
      const existing=await this.db.query<{event_id:string}>("SELECT event_id FROM event_ledger WHERE tenant_id=$2 AND idempotency_key=$15 AND ROW(event_id,tenant_id,scope_type,scope_id,event_type,event_version,occurred_at,actor_type,actor_id,subject_type,subject_id,source,correlation_id,causation_id,idempotency_key,before_state,after_state,data,evidence) IS NOT DISTINCT FROM ROW($1::uuid,$2::uuid,$3::text,$4::text,$5::text,$6::integer,$7::timestamptz,$8::text,$9::text,$10::text,$11::text,$12::text,$13::text,$14::text,$15::text,$16::jsonb,$17::jsonb,$18::jsonb,$19::jsonb)",values);
      if(existing.rowCount!==1) throw new Error("Event idempotency conflict");
    }
  }

  async getById(tenantId:string,eventId: string): Promise<LegacyEvent | null> {
    const result = await this.db.query<EventRow>(
      "SELECT * FROM event_ledger WHERE tenant_id=$1 AND event_id = $2 LIMIT 1",
      [tenantId,eventId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async listBySubject(tenantId:string,entityType: string, entityId: string): Promise<LegacyEvent[]> {
    const result = await this.db.query<EventRow>(
      "SELECT * FROM event_ledger WHERE tenant_id=$1 AND subject_type = $2 AND subject_id = $3 ORDER BY sequence_no",
      [tenantId,entityType, entityId]
    );
    return result.rows.map(mapRow);
  }

  async listByCorrelation(tenantId:string,correlationId: string): Promise<LegacyEvent[]> {
    const result = await this.db.query<EventRow>(
      "SELECT * FROM event_ledger WHERE tenant_id=$1 AND correlation_id = $2 ORDER BY sequence_no",
      [tenantId,correlationId]
    );
    return result.rows.map(mapRow);
  }
}


export interface EventFeedQuery {tenantId:string;actorId:string;scopeType:string;scopeId:string;subjectType:string;subjectId?:string;eventTypes:string[];after:string;limit:number}
/** Bounded read over the SAME durable event ledger. SHARE waits for existing
 * INSERT transactions before selecting sequence order, preventing an earlier
 * uncommitted bigserial row from appearing behind the returned cursor. It briefly
 * blocks new ledger writers globally; timeouts deny rather than skip a gap.
 * Direct privileged SQL that manually reserves/inserts old sequence numbers is
 * outside this service contract. No new ledger/counter/migration is introduced.
 */
export async function readEventFeed(db:SqlDatabase,input:EventFeedQuery){
 const token=(x:unknown)=>typeof x==='string'&&!!x&&x.length<=512&&!/[\u0000-\u001f]/.test(x);
 if(!db||typeof db.begin!=='function'||![input.tenantId,input.actorId,input.scopeType,input.scopeId,input.subjectType].every(token)||input.subjectId!==undefined&&!token(input.subjectId)||!Array.isArray(input.eventTypes)||!input.eventTypes.length||input.eventTypes.length>10||input.eventTypes.some(x=>!token(x))||!/^(0|[1-9][0-9]{0,18})$/.test(input.after)||BigInt(input.after)>9223372036854775807n||!Number.isSafeInteger(input.limit)||input.limit<1||input.limit>100)throw Error('Invalid event feed query');
 const tx=await db.begin();
 try{
  await tx.query("SET LOCAL lock_timeout='2000ms'");await tx.query("SET LOCAL statement_timeout='2000ms'");
  await tx.query('LOCK TABLE event_ledger IN SHARE MODE');
  const params=[input.tenantId,input.actorId,input.scopeType,input.scopeId,input.subjectType,input.subjectId??null,input.eventTypes,input.after,input.limit];
  const where='tenant_id=$1 AND actor_id=$2 AND scope_type=$3 AND scope_id=$4 AND subject_type=$5 AND ($6::text IS NULL OR subject_id=$6) AND event_type=ANY($7::text[]) AND sequence_no>$8::bigint';
  // Admit size metadata before transferring any raw payload into this process.
  // The conservative1KiB allowance covers the canonical nested identity wrapper.
  const sizes=await tx.query<{event_id:string;encoded_bytes:number}>(`SELECT event_id,octet_length(row_to_json(e)::text) encoded_bytes FROM event_ledger e WHERE ${where} ORDER BY sequence_no LIMIT $9`,params);
  let projected=0;const ids:string[]=[];for(const row of sizes.rows){if(row.encoded_bytes+1024>48000){if(ids.length)break;throw Error('Invalid event feed oversized event');}if(projected+row.encoded_bytes+1024>48000)break;ids.push(row.event_id);projected+=row.encoded_bytes+1024;}
  const rows=ids.length?await tx.query<EventRow&{sequence_no:string}>(`SELECT * FROM event_ledger WHERE ${where} AND event_id=ANY($10::uuid[]) ORDER BY sequence_no LIMIT $9`,[...params,ids]):{rows:[],rowCount:0};
  let bytes=0,last=input.after;const events:LegacyEvent[]=[];
  for(const row of rows.rows){const event=mapRow(row),size=Buffer.byteLength(JSON.stringify(event));if(size>48000)throw Error('Invalid event feed oversized event');if(bytes+size>48000)break;events.push(event);bytes+=size;last=String(row.sequence_no);}
  await tx.commit();return{events,after:last};
 }catch(error){await tx.rollback();throw error;}
}
