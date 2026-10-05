export interface AuditRecord {
  id:number;
  tenantId:string;
  actorType:string;
  actorId:string;
  action:string;
  resourceType:string;
  resourceId?:string;
  decision:string;
  reason?:string;
  correlationId?:string;
  evidence:Record<string,unknown>;
  createdAt:string;
}

export interface AuditQueryPort {
  list(input:{
    tenantId:string;
    actorId?:string;
    resourceType?:string;
    resourceId?:string;
    action?:string;
    from?:string;
    to?:string;
    limit?:number;
  }):Promise<AuditRecord[]>;
}

export interface RetentionPolicy {
  tenantId:string;
  resourceType:string;
  retentionDays:number;
  archiveAfterDays?:number;
  deleteAfterDays?:number;
  legalHold:boolean;
}

export interface RetentionPolicyRepository {
  upsert(policy:RetentionPolicy):Promise<void>;
  get(tenantId:string,resourceType:string):Promise<RetentionPolicy|null>;
}

export class RetentionPlanner {
  plan(policy:RetentionPolicy,createdAt:string,now=new Date()):{
    archive:boolean;
    delete:boolean;
    reason:string;
  }{
    if(policy.legalHold) return {archive:false,delete:false,reason:"Legal hold active"};
    const ageDays=(now.getTime()-new Date(createdAt).getTime())/86_400_000;
    if(policy.deleteAfterDays!==undefined && ageDays>=policy.deleteAfterDays){
      return {archive:false,delete:true,reason:"Delete threshold reached"};
    }
    if(policy.archiveAfterDays!==undefined && ageDays>=policy.archiveAfterDays){
      return {archive:true,delete:false,reason:"Archive threshold reached"};
    }
    return {archive:false,delete:false,reason:"Retention window active"};
  }
}
