import type {
  Booking,
  Company,
  Contact,
  Opportunity,
  Pipeline,
  PipelineStage,
  Task,
  EntityRepository,
  CrmRepositories
} from "@mgr/legacy-crm";
import type { SqlExecutor } from "./sql.js";

type TableConfig<T> = {
  table:string;
  toRow:(value:T)=>Record<string,unknown>;
  fromRow:(row:any)=>T;
};

class PostgresEntityRepository<T extends {id:string;tenantId:string}> implements EntityRepository<T> {
  constructor(private readonly db:SqlExecutor,private readonly config:TableConfig<T>){}

  async create(value:T):Promise<T>{
    const row=this.config.toRow(value);
    const columns=Object.keys(row);
    const values=Object.values(row);
    const placeholders=columns.map((_,i)=>`$${i+1}`).join(",");
    const result=await this.db.query(
      `INSERT INTO ${this.config.table} (${columns.join(",")}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return this.config.fromRow(result.rows[0]);
  }

  async get(tenantId:string,id:string):Promise<T|null>{
    const result=await this.db.query(
      `SELECT * FROM ${this.config.table} WHERE tenant_id=$1 AND id=$2 LIMIT 1`,
      [tenantId,id]
    );
    return result.rows[0] ? this.config.fromRow(result.rows[0]) : null;
  }

  async update(tenantId:string,id:string,patch:Partial<T>):Promise<T>{
    const existing=await this.get(tenantId,id);
    if(!existing) throw new Error(`Entity not found: ${id}`);
    const merged={...existing,...patch,id:existing.id,tenantId:existing.tenantId} as T;
    const row=this.config.toRow(merged);
    const entries=Object.entries(row).filter(([key])=>!["id","tenant_id"].includes(key));
    const assignments=entries.map(([key],i)=>`${key}=$${i+3}`).join(",");
    const params=[tenantId,id,...entries.map(([,value])=>value)];
    const result=await this.db.query(
      `UPDATE ${this.config.table} SET ${assignments} WHERE tenant_id=$1 AND id=$2 RETURNING *`,
      params
    );
    return this.config.fromRow(result.rows[0]);
  }

  async list(tenantId:string):Promise<T[]>{
    const result=await this.db.query(
      `SELECT * FROM ${this.config.table} WHERE tenant_id=$1 ORDER BY created_at NULLS LAST, id`,
      [tenantId]
    );
    return result.rows.map(this.config.fromRow);
  }

  async delete(tenantId:string,id:string):Promise<void>{
    await this.db.query(
      `DELETE FROM ${this.config.table} WHERE tenant_id=$1 AND id=$2`,
      [tenantId,id]
    );
  }
}

const iso=(value:any):string|undefined=>value ? new Date(value).toISOString() : undefined;

const contactConfig:TableConfig<Contact>={
  table:"entities",
  toRow:(value)=>({
    id:value.id,
    tenant_id:value.tenantId,
    entity_type:"person",
    display_name:[value.firstName,value.lastName].filter(Boolean).join(" "),
    owner_actor_id:value.ownerId,
    lifecycle_state:value.status,
    attributes:JSON.stringify({
      firstName:value.firstName,lastName:value.lastName,email:value.email,phone:value.phone,
      companyId:value.companyId,source:value.source,tags:value.tags,score:value.score,customFields:value.customFields
    }),
    created_at:value.createdAt,
    updated_at:value.updatedAt
  }),
  fromRow:(row)=>({
    id:row.id,tenantId:row.tenant_id,ownerId:row.owner_actor_id,
    firstName:row.attributes?.firstName ?? row.display_name,lastName:row.attributes?.lastName,
    email:row.attributes?.email,phone:row.attributes?.phone,companyId:row.attributes?.companyId,
    status:row.lifecycle_state ?? "lead",source:row.attributes?.source,tags:row.attributes?.tags ?? [],
    score:row.attributes?.score ?? 0,customFields:row.attributes?.customFields ?? {},
    createdAt:iso(row.created_at)!,updatedAt:iso(row.updated_at)!
  })
};

const companyConfig:TableConfig<Company>={
  table:"entities",
  toRow:(value)=>({
    id:value.id,tenant_id:value.tenantId,entity_type:"company",display_name:value.name,
    owner_actor_id:value.ownerId,attributes:JSON.stringify({
      website:value.website,industry:value.industry,tags:value.tags,customFields:value.customFields
    }),created_at:value.createdAt,updated_at:value.updatedAt
  }),
  fromRow:(row)=>({
    id:row.id,tenantId:row.tenant_id,ownerId:row.owner_actor_id,name:row.display_name,
    website:row.attributes?.website,industry:row.attributes?.industry,tags:row.attributes?.tags ?? [],
    customFields:row.attributes?.customFields ?? {},createdAt:iso(row.created_at)!,updatedAt:iso(row.updated_at)!
  })
};

const pipelineConfig:TableConfig<Pipeline>={
  table:"pipelines",
  toRow:(value)=>({
    id:value.id,tenant_id:value.tenantId,name:value.name,description:value.description ?? null,is_default:value.default
  }),
  fromRow:(row)=>({
    id:row.id,tenantId:row.tenant_id,name:row.name,description:row.description ?? undefined,default:row.is_default
  })
};

const stageConfig:TableConfig<PipelineStage>={
  table:"pipeline_stages",
  toRow:(value)=>({
    id:value.id,tenant_id:value.tenantId,pipeline_id:value.pipelineId,name:value.name,
    stage_order:value.order,probability:value.probability ?? null
  }),
  fromRow:(row)=>({
    id:row.id,tenantId:row.tenant_id,pipelineId:row.pipeline_id,name:row.name,
    order:row.stage_order,probability:row.probability ?? undefined
  })
};

const opportunityConfig:TableConfig<Opportunity>={
  table:"opportunities",
  toRow:(value)=>({
    id:value.id,tenant_id:value.tenantId,owner_actor_id:value.ownerId,
    contact_entity_id:value.contactId ?? null,company_entity_id:value.companyId ?? null,
    pipeline_id:value.pipelineId,stage_id:value.stageId,title:value.title,value:value.value,
    currency:value.currency,status:value.status,probability:value.probability,
    expected_close_at:value.expectedCloseAt ?? null,closed_at:value.closedAt ?? null,
    custom_fields:JSON.stringify(value.customFields),created_at:value.createdAt,updated_at:value.updatedAt
  }),
  fromRow:(row)=>({
    id:row.id,tenantId:row.tenant_id,ownerId:row.owner_actor_id,contactId:row.contact_entity_id ?? undefined,
    companyId:row.company_entity_id ?? undefined,pipelineId:row.pipeline_id,stageId:row.stage_id,
    title:row.title,value:Number(row.value),currency:row.currency,status:row.status,
    probability:row.probability,expectedCloseAt:iso(row.expected_close_at),closedAt:iso(row.closed_at),
    customFields:row.custom_fields ?? {},createdAt:iso(row.created_at)!,updatedAt:iso(row.updated_at)!
  })
};

const taskConfig:TableConfig<Task>={
  table:"tasks",
  toRow:(value)=>({
    id:value.id,tenant_id:value.tenantId,owner_actor_id:value.ownerId,subject_type:value.subjectType,
    subject_id:value.subjectId,title:value.title,description:value.description ?? null,status:value.status,
    priority:value.priority,due_at:value.dueAt ?? null,completed_at:value.completedAt ?? null,
    created_at:value.createdAt,updated_at:value.updatedAt
  }),
  fromRow:(row)=>({
    id:row.id,tenantId:row.tenant_id,ownerId:row.owner_actor_id,subjectType:row.subject_type,
    subjectId:row.subject_id,title:row.title,description:row.description ?? undefined,status:row.status,
    priority:row.priority,dueAt:iso(row.due_at),completedAt:iso(row.completed_at),
    createdAt:iso(row.created_at)!,updatedAt:iso(row.updated_at)!
  })
};

const bookingConfig:TableConfig<Booking>={
  table:"bookings",
  toRow:(value)=>({
    id:value.id,tenant_id:value.tenantId,owner_actor_id:value.ownerId,contact_entity_id:value.contactId ?? null,
    title:value.title,start_at:value.startAt,end_at:value.endAt,status:value.status,
    meeting_url:value.meetingUrl ?? null,metadata:JSON.stringify(value.metadata),
    created_at:value.createdAt,updated_at:value.updatedAt
  }),
  fromRow:(row)=>({
    id:row.id,tenantId:row.tenant_id,ownerId:row.owner_actor_id,contactId:row.contact_entity_id ?? undefined,
    startAt:iso(row.start_at)!,endAt:iso(row.end_at)!,status:row.status,title:row.title,
    meetingUrl:row.meeting_url ?? undefined,metadata:row.metadata ?? {},
    createdAt:iso(row.created_at)!,updatedAt:iso(row.updated_at)!
  })
};

export function createPostgresCrmRepositories(db:SqlExecutor):CrmRepositories{
  return {
    contacts:new PostgresEntityRepository(db,contactConfig),
    companies:new PostgresEntityRepository(db,companyConfig),
    pipelines:new PostgresEntityRepository(db,pipelineConfig),
    stages:new PostgresEntityRepository(db,stageConfig),
    opportunities:new PostgresEntityRepository(db,opportunityConfig),
    tasks:new PostgresEntityRepository(db,taskConfig),
    bookings:new PostgresEntityRepository(db,bookingConfig)
  };
}
