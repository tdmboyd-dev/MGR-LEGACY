import type {
  ActivityRecord,
  ActivityRepository,
  CaseRepository,
  ServiceCase
} from "@mgr/legacy-crm";
import type { SqlExecutor } from "./sql.js";

export class PostgresActivityRepository implements ActivityRepository {
  constructor(private readonly db:SqlExecutor){}

  async create(a:ActivityRecord):Promise<ActivityRecord>{
    await this.db.query(
      `INSERT INTO activities
       (id,tenant_id,owner_actor_id,subject_type,subject_id,activity_type,title,notes,occurred_at,due_at,completed_at,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)`,
      [
        a.id,a.tenantId,a.ownerId,a.subjectType,a.subjectId,a.type,a.title,a.notes ?? null,
        a.occurredAt,a.dueAt ?? null,a.completedAt ?? null,JSON.stringify(a.metadata)
      ]
    );
    return a;
  }

  async listForSubject(tenantId:string,subjectType:string,subjectId:string,limit=200):Promise<ActivityRecord[]>{
    const result=await this.db.query<any>(
      `SELECT * FROM activities
       WHERE tenant_id=$1 AND subject_type=$2 AND subject_id=$3
       ORDER BY occurred_at DESC LIMIT $4`,
      [tenantId,subjectType,subjectId,limit]
    );
    return result.rows.map(row=>({
      id:row.id,tenantId:row.tenant_id,ownerId:row.owner_actor_id,
      subjectType:row.subject_type,subjectId:row.subject_id,type:row.activity_type,
      title:row.title,notes:row.notes ?? undefined,occurredAt:new Date(row.occurred_at).toISOString(),
      dueAt:row.due_at ? new Date(row.due_at).toISOString():undefined,
      completedAt:row.completed_at ? new Date(row.completed_at).toISOString():undefined,
      metadata:row.metadata ?? {}
    }));
  }
}

export class PostgresCaseRepository implements CaseRepository {
  constructor(private readonly db:SqlExecutor){}

  async create(value:ServiceCase):Promise<ServiceCase>{
    await this.db.query(
      `INSERT INTO service_cases
       (id,tenant_id,owner_actor_id,contact_entity_id,title,description,status,priority,sla_due_at,source,tags,custom_fields,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14)`,
      [
        value.id,value.tenantId,value.ownerId,value.contactId ?? null,value.title,value.description ?? null,
        value.status,value.priority,value.slaDueAt ?? null,value.source ?? null,value.tags,
        JSON.stringify(value.customFields),value.createdAt,value.updatedAt
      ]
    );
    return value;
  }

  async get(tenantId:string,id:string):Promise<ServiceCase|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM service_cases WHERE tenant_id=$1 AND id=$2 LIMIT 1",
      [tenantId,id]
    );
    return result.rows[0] ? this.fromRow(result.rows[0]) : null;
  }

  async update(tenantId:string,id:string,patch:Partial<ServiceCase>):Promise<ServiceCase>{
    const current=await this.get(tenantId,id);
    if(!current) throw new Error("Case not found");
    const next={...current,...patch,id:current.id,tenantId:current.tenantId};
    await this.db.query(
      `UPDATE service_cases SET
        owner_actor_id=$3,contact_entity_id=$4,title=$5,description=$6,status=$7,priority=$8,
        sla_due_at=$9,source=$10,tags=$11,custom_fields=$12::jsonb,updated_at=$13
       WHERE tenant_id=$1 AND id=$2`,
      [
        tenantId,id,next.ownerId,next.contactId ?? null,next.title,next.description ?? null,next.status,next.priority,
        next.slaDueAt ?? null,next.source ?? null,next.tags,JSON.stringify(next.customFields),next.updatedAt
      ]
    );
    return next;
  }

  async list(tenantId:string):Promise<ServiceCase[]>{
    const result=await this.db.query<any>(
      "SELECT * FROM service_cases WHERE tenant_id=$1 ORDER BY updated_at DESC",
      [tenantId]
    );
    return result.rows.map(row=>this.fromRow(row));
  }

  private fromRow(row:any):ServiceCase{
    return {
      id:row.id,tenantId:row.tenant_id,ownerId:row.owner_actor_id,
      contactId:row.contact_entity_id ?? undefined,title:row.title,description:row.description ?? undefined,
      status:row.status,priority:row.priority,slaDueAt:row.sla_due_at?new Date(row.sla_due_at).toISOString():undefined,
      source:row.source ?? undefined,tags:row.tags ?? [],customFields:row.custom_fields ?? {},
      createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at).toISOString()
    };
  }
}
