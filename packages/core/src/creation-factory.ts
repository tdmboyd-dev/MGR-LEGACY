export type MediaJobType="image"|"video"|"audio"|"3d"|"document"|"web";

export interface CreationJob {
  jobId:string;
  tenantId:string;
  type:MediaJobType;
  prompt:string;
  inputs:Array<{kind:string;uri:string;sha256?:string}>;
  provider?:string;
  model?:string;
  status:"queued"|"running"|"succeeded"|"failed"|"cancelled";
  createdAt:string;
  startedAt?:string;
  completedAt?:string;
  cost?:number;
  outputs:Array<{kind:string;uri:string;sha256?:string;metadata?:Record<string,unknown>}>;
  evidence:Record<string,unknown>;
  error?:string;
}

export interface MediaJobLedger {
  save(job:CreationJob):Promise<void>;
  get(tenantId:string,jobId:string):Promise<CreationJob|null>;
  list(tenantId:string,limit?:number):Promise<CreationJob[]>;
}

export interface CreationProvider {
  providerKey:string;
  supports(type:MediaJobType):boolean;
  run(job:CreationJob):Promise<CreationJob>;
}

export class CreationFactory {
  constructor(private readonly providers:CreationProvider[],private readonly ledger:MediaJobLedger){}

  async execute(job:CreationJob):Promise<CreationJob>{
    await this.ledger.save(job);
    const provider=this.providers.find(item=>item.supports(job.type));
    if(!provider){
      const failed={...job,status:"failed" as const,error:`No provider supports ${job.type}`,completedAt:new Date().toISOString()};
      await this.ledger.save(failed);
      return failed;
    }
    const result=await provider.run({...job,provider:provider.providerKey,status:"running",startedAt:new Date().toISOString()});
    await this.ledger.save(result);
    return result;
  }
}
