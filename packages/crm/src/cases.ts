export type CaseStatus="open"|"in_progress"|"waiting"|"resolved"|"closed";
export type CasePriority="low"|"normal"|"high"|"urgent";

export interface ServiceCase {
  id:string;
  tenantId:string;
  ownerId:string;
  contactId?:string;
  title:string;
  description?:string;
  status:CaseStatus;
  priority:CasePriority;
  slaDueAt?:string;
  source?:string;
  tags:string[];
  customFields:Record<string,unknown>;
  createdAt:string;
  updatedAt:string;
}

export interface CaseRepository {
  create(value:ServiceCase):Promise<ServiceCase>;
  get(tenantId:string,id:string):Promise<ServiceCase|null>;
  update(tenantId:string,id:string,patch:Partial<ServiceCase>):Promise<ServiceCase>;
  list(tenantId:string):Promise<ServiceCase[]>;
}

export class CaseService {
  constructor(private readonly repo:CaseRepository){}

  create(value:ServiceCase):Promise<ServiceCase>{ return this.repo.create(value); }

  async resolve(tenantId:string,id:string,at=new Date()):Promise<ServiceCase>{
    return this.repo.update(tenantId,id,{
      status:"resolved",
      updatedAt:at.toISOString()
    });
  }
}
