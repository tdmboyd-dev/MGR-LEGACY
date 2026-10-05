import type {
  InboxRepository,
  InboxThreadSummary,
  Message,
  MessageTemplate,
  SequenceDefinition,
  SequenceEnrollment
} from "@mgr/legacy-communications";
import type { SqlExecutor } from "./sql.js";

export class PostgresInboxRepository implements InboxRepository {
  constructor(private readonly db:SqlExecutor){}

  async listThreads(tenantId:string,_ownerId?:string,limit=100):Promise<InboxThreadSummary[]>{
    const result=await this.db.query<any>(
      `SELECT t.id AS thread_id,t.tenant_id,t.subject,t.contact_entity_ids,t.channels,t.last_activity_at,
              COALESCE(MAX(m.sent_at),t.last_activity_at) AS last_message_at,
              COALESCE((ARRAY_AGG(m.body ORDER BY m.sent_at DESC))[1],'') AS preview
       FROM communication_threads t
       LEFT JOIN messages m ON m.thread_id=t.id
       WHERE t.tenant_id=$1
       GROUP BY t.id
       ORDER BY COALESCE(MAX(m.sent_at),t.last_activity_at) DESC NULLS LAST
       LIMIT $2`,
      [tenantId,limit]
    );
    return result.rows.map(row=>({
      threadId:row.thread_id,
      tenantId:row.tenant_id,
      contactIds:row.contact_entity_ids ?? [],
      subject:row.subject ?? undefined,
      channels:row.channels ?? [],
      lastMessageAt:row.last_message_at?new Date(row.last_message_at).toISOString():undefined,
      unreadCount:0,
      lastMessagePreview:row.preview || undefined
    }));
  }

  async listMessages(tenantId:string,threadId:string,limit=200):Promise<Message[]>{
    const result=await this.db.query<any>(
      `SELECT * FROM messages WHERE tenant_id=$1 AND thread_id=$2 ORDER BY sent_at ASC LIMIT $3`,
      [tenantId,threadId,limit]
    );
    return result.rows.map(row=>({
      id:row.id,tenantId:row.tenant_id,threadId:row.thread_id,channel:row.channel,
      direction:row.direction,sender:row.sender,recipients:row.recipients ?? [],body:row.body,
      sentAt:new Date(row.sent_at).toISOString(),metadata:row.metadata ?? {}
    }));
  }

  async markRead(tenantId:string,threadId:string,actorId:string):Promise<void>{
    await this.db.query(
      `INSERT INTO inbox_read_state (tenant_id,thread_id,actor_id,last_read_at)
       VALUES ($1,$2,$3,now())
       ON CONFLICT (tenant_id,thread_id,actor_id)
       DO UPDATE SET last_read_at=now()`,
      [tenantId,threadId,actorId]
    );
  }
}

export class PostgresTemplateSequenceRepository {
  constructor(private readonly db:SqlExecutor){}

  async saveTemplate(template:MessageTemplate):Promise<void>{
    await this.db.query(
      `INSERT INTO message_templates
       (id,tenant_id,name,channel,subject,body,variables,active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id)
       DO UPDATE SET name=EXCLUDED.name,channel=EXCLUDED.channel,subject=EXCLUDED.subject,body=EXCLUDED.body,
       variables=EXCLUDED.variables,active=EXCLUDED.active,updated_at=now()`,
      [template.id,template.tenantId,template.name,template.channel,template.subject ?? null,template.body,template.variables,template.active]
    );
  }

  async saveSequence(sequence:SequenceDefinition):Promise<void>{
    await this.db.query(
      `INSERT INTO communication_sequences (id,tenant_id,name,steps,active)
       VALUES ($1,$2,$3,$4::jsonb,$5)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,steps=EXCLUDED.steps,active=EXCLUDED.active,updated_at=now()`,
      [sequence.id,sequence.tenantId,sequence.name,JSON.stringify(sequence.steps),sequence.active]
    );
  }

  async saveEnrollment(enrollment:SequenceEnrollment):Promise<void>{
    await this.db.query(
      `INSERT INTO sequence_enrollments
       (id,sequence_id,tenant_id,contact_id,current_step,next_run_at,status,replied)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET current_step=EXCLUDED.current_step,next_run_at=EXCLUDED.next_run_at,
       status=EXCLUDED.status,replied=EXCLUDED.replied,updated_at=now()`,
      [enrollment.id,enrollment.sequenceId,enrollment.tenantId,enrollment.contactId,enrollment.currentStep,
       enrollment.nextRunAt,enrollment.status,enrollment.replied]
    );
  }
}
