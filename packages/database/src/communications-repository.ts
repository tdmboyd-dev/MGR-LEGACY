import type {
  Channel,
  ConsentRecord,
  Message,
  ConsentRepository,
  MessageRepository
} from "@mgr/legacy-communications";
import type { SqlExecutor } from "./sql.js";

export class PostgresConsentRepository implements ConsentRepository {
  constructor(private readonly db:SqlExecutor){}

  async get(tenantId:string,contactId:string,channel:Channel):Promise<ConsentRecord|null>{
    const result=await this.db.query<any>(
      `SELECT tenant_id,contact_entity_id,channel,status,source,quiet_hours,updated_at
       FROM consent_records
       WHERE tenant_id=$1 AND contact_entity_id=$2 AND channel=$3
       LIMIT 1`,
      [tenantId,contactId,channel]
    );
    const row=result.rows[0];
    return row ? {
      tenantId:row.tenant_id,
      contactId:row.contact_entity_id,
      channel:row.channel,
      status:row.status,
      source:row.source,
      quietHours:row.quiet_hours ?? undefined,
      updatedAt:new Date(row.updated_at).toISOString()
    } : null;
  }

  async upsert(record:ConsentRecord):Promise<void>{
    await this.db.query(
      `INSERT INTO consent_records
       (tenant_id,contact_entity_id,channel,status,source,quiet_hours,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)
       ON CONFLICT (tenant_id,contact_entity_id,channel)
       DO UPDATE SET status=EXCLUDED.status,source=EXCLUDED.source,quiet_hours=EXCLUDED.quiet_hours,updated_at=EXCLUDED.updated_at`,
      [
        record.tenantId,record.contactId,record.channel,record.status,record.source,
        JSON.stringify(record.quietHours ?? null),record.updatedAt
      ]
    );
  }
}

export class PostgresMessageRepository implements MessageRepository {
  constructor(private readonly db:SqlExecutor){}

  async save(message:Message):Promise<Message>{
    const result=await this.db.query<any>(
      `INSERT INTO messages
       (id,tenant_id,thread_id,channel,direction,sender,recipients,body,provider_message_id,metadata,sent_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)
       RETURNING *`,
      [
        message.id,message.tenantId,message.threadId,message.channel,message.direction,
        message.sender,message.recipients,message.body,
        String(message.metadata.providerMessageId ?? "") || null,
        JSON.stringify(message.metadata),message.sentAt
      ]
    );
    return this.fromRow(result.rows[0]);
  }

  async listThread(tenantId:string,threadId:string,limit=200):Promise<Message[]>{
    const result=await this.db.query<any>(
      `SELECT * FROM messages
       WHERE tenant_id=$1 AND thread_id=$2
       ORDER BY sent_at ASC
       LIMIT $3`,
      [tenantId,threadId,limit]
    );
    return result.rows.map(row=>this.fromRow(row));
  }

  private fromRow(row:any):Message{
    return {
      id:row.id,
      tenantId:row.tenant_id,
      threadId:row.thread_id,
      channel:row.channel,
      direction:row.direction,
      sender:row.sender,
      recipients:row.recipients ?? [],
      body:row.body,
      sentAt:new Date(row.sent_at).toISOString(),
      metadata:row.metadata ?? {}
    };
  }
}
