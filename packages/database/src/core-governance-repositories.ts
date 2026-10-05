import type {
  ObjectSchemaRepository,
  ObjectSchemaVersion,
  OwnershipAssignment,
  OwnershipRepository,
  PreferenceRecord,
  PreferenceRepository
} from "@mgr/legacy-core";
import type { SqlExecutor } from "./sql.js";

export class PostgresOwnershipRepository implements OwnershipRepository {
  constructor(private readonly db:SqlExecutor){}
  async assign(value:OwnershipAssignment):Promise<void>{
    await this.db.query(
      `INSERT INTO ownership_assignments
       (tenant_id,resource_type,resource_id,owner_actor_id,assigned_by_actor_id,reason,assigned_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (tenant_id,resource_type,resource_id)
       DO UPDATE SET owner_actor_id=EXCLUDED.owner_actor_id,assigned_by_actor_id=EXCLUDED.assigned_by_actor_id,
       reason=EXCLUDED.reason,assigned_at=EXCLUDED.assigned_at`,
      [value.tenantId,value.resourceType,value.resourceId,value.ownerActorId,value.assignedByActorId ?? null,value.reason ?? null,value.assignedAt]
    );
  }
  async get(tenantId:string,resourceType:string,resourceId:string):Promise<OwnershipAssignment|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM ownership_assignments WHERE tenant_id=$1 AND resource_type=$2 AND resource_id=$3 LIMIT 1",
      [tenantId,resourceType,resourceId]
    );
    const row=result.rows[0];
    return row ? {
      tenantId:row.tenant_id,resourceType:row.resource_type,resourceId:row.resource_id,
      ownerActorId:row.owner_actor_id,assignedByActorId:row.assigned_by_actor_id ?? undefined,
      reason:row.reason ?? undefined,assignedAt:new Date(row.assigned_at).toISOString()
    } : null;
  }
}

export class PostgresPreferenceRepository implements PreferenceRepository {
  constructor(private readonly db:SqlExecutor){}
  async upsert(value:PreferenceRecord):Promise<void>{
    await this.db.query(
      `INSERT INTO preference_records
       (tenant_id,subject_type,subject_id,preference_key,value,source,updated_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)
       ON CONFLICT (tenant_id,subject_type,subject_id,preference_key)
       DO UPDATE SET value=EXCLUDED.value,source=EXCLUDED.source,updated_at=EXCLUDED.updated_at`,
      [value.tenantId,value.subjectType,value.subjectId,value.key,JSON.stringify(value.value),value.source,value.updatedAt]
    );
  }
  async get(tenantId:string,subjectType:string,subjectId:string,key:string):Promise<PreferenceRecord|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM preference_records WHERE tenant_id=$1 AND subject_type=$2 AND subject_id=$3 AND preference_key=$4 LIMIT 1",
      [tenantId,subjectType,subjectId,key]
    );
    const row=result.rows[0];
    return row ? {
      tenantId:row.tenant_id,subjectType:row.subject_type,subjectId:row.subject_id,key:row.preference_key,
      value:row.value,source:row.source,updatedAt:new Date(row.updated_at).toISOString()
    } : null;
  }
}

export class PostgresObjectSchemaRepository implements ObjectSchemaRepository {
  constructor(private readonly db:SqlExecutor){}
  async save(value:ObjectSchemaVersion):Promise<void>{
    await this.db.query(
      `INSERT INTO object_schema_versions
       (tenant_id,object_key,version,status,schema,created_at,activated_at,retired_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)`,
      [value.tenantId,value.objectKey,value.version,value.status,JSON.stringify(value.schema),value.createdAt,value.activatedAt ?? null,value.retiredAt ?? null]
    );
  }
  async latest(tenantId:string,objectKey:string):Promise<ObjectSchemaVersion|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM object_schema_versions WHERE tenant_id=$1 AND object_key=$2 ORDER BY version DESC LIMIT 1",
      [tenantId,objectKey]
    );
    const row=result.rows[0];
    return row ? {
      tenantId:row.tenant_id,objectKey:row.object_key,version:row.version,status:row.status,schema:row.schema ?? {},
      createdAt:new Date(row.created_at).toISOString(),
      activatedAt:row.activated_at?new Date(row.activated_at).toISOString():undefined,
      retiredAt:row.retired_at?new Date(row.retired_at).toISOString():undefined
    } : null;
  }
  async activate(tenantId:string,objectKey:string,version:number):Promise<void>{
    await this.db.query(
      "UPDATE object_schema_versions SET status='retired',retired_at=now() WHERE tenant_id=$1 AND object_key=$2 AND status='active'",
      [tenantId,objectKey]
    );
    const result=await this.db.query(
      "UPDATE object_schema_versions SET status='active',activated_at=now(),retired_at=NULL WHERE tenant_id=$1 AND object_key=$2 AND version=$3 RETURNING version",
      [tenantId,objectKey,version]
    );
    if(result.rowCount!==1) throw new Error("Object schema version not found");
  }
}
