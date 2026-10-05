export interface ObjectSchemaVersion {
  tenantId:string;
  objectKey:string;
  version:number;
  status:"draft"|"active"|"retired";
  schema:Record<string,unknown>;
  createdAt:string;
  activatedAt?:string;
  retiredAt?:string;
}

export interface ObjectSchemaRepository {
  save(value:ObjectSchemaVersion):Promise<void>;
  latest(tenantId:string,objectKey:string):Promise<ObjectSchemaVersion|null>;
  activate(tenantId:string,objectKey:string,version:number):Promise<void>;
}

export class ObjectSchemaLifecycle {
  constructor(private readonly repo:ObjectSchemaRepository){}

  async draft(tenantId:string,objectKey:string,schema:Record<string,unknown>,now=new Date()):Promise<ObjectSchemaVersion>{
    const latest=await this.repo.latest(tenantId,objectKey);
    const value:ObjectSchemaVersion={
      tenantId,
      objectKey,
      version:(latest?.version ?? 0)+1,
      status:"draft",
      schema,
      createdAt:now.toISOString()
    };
    await this.repo.save(value);
    return value;
  }

  async activate(tenantId:string,objectKey:string,version:number):Promise<void>{
    await this.repo.activate(tenantId,objectKey,version);
  }
}
