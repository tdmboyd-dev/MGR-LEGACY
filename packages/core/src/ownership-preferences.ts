export interface OwnershipAssignment {
  tenantId:string;
  resourceType:string;
  resourceId:string;
  ownerActorId:string;
  assignedByActorId?:string;
  reason?:string;
  assignedAt:string;
}

export interface OwnershipRepository {
  assign(value:OwnershipAssignment):Promise<void>;
  get(tenantId:string,resourceType:string,resourceId:string):Promise<OwnershipAssignment|null>;
}

export class OwnershipService {
  constructor(private readonly repo:OwnershipRepository){}
  assign(value:OwnershipAssignment):Promise<void>{ return this.repo.assign(value); }
  get(tenantId:string,resourceType:string,resourceId:string){ return this.repo.get(tenantId,resourceType,resourceId); }
}

export interface PreferenceRecord {
  tenantId:string;
  subjectType:string;
  subjectId:string;
  key:string;
  value:unknown;
  source:string;
  updatedAt:string;
}

export interface PreferenceRepository {
  upsert(value:PreferenceRecord):Promise<void>;
  get(tenantId:string,subjectType:string,subjectId:string,key:string):Promise<PreferenceRecord|null>;
}

export class PreferenceService {
  constructor(private readonly repo:PreferenceRepository){}
  upsert(value:PreferenceRecord):Promise<void>{ return this.repo.upsert(value); }
  get(tenantId:string,subjectType:string,subjectId:string,key:string){ return this.repo.get(tenantId,subjectType,subjectId,key); }
}
