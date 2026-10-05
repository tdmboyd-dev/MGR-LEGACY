export interface TaxWorkflowContext {
  tenantId:string;
  clientEntityId:string;
  taxYear:number;
  returnId?:string;
  officeId?:string;
  preparerId?:string;
}

export interface TaxWorkflowNode {
  type:string;
  execute(config:Record<string,unknown>,context:TaxWorkflowContext):Promise<Record<string,unknown>>;
}

export class RequestMissingDocumentsNode implements TaxWorkflowNode {
  readonly type="tax.request_missing_documents";
  constructor(private readonly request:(ctx:TaxWorkflowContext,documentCodes:string[])=>Promise<void>){}
  async execute(config:Record<string,unknown>,context:TaxWorkflowContext):Promise<Record<string,unknown>>{
    const codes=Array.isArray(config.documentCodes) ? config.documentCodes.map(String) : [];
    await this.request(context,codes);
    return {requested:codes};
  }
}

export class SetTaxLifecycleStageNode implements TaxWorkflowNode {
  readonly type="tax.set_client_stage";
  constructor(private readonly setStage:(ctx:TaxWorkflowContext,stage:string)=>Promise<void>){}
  async execute(config:Record<string,unknown>,context:TaxWorkflowContext):Promise<Record<string,unknown>>{
    const stage=String(config.stage ?? "");
    if(!stage) throw new Error("Tax lifecycle stage is required");
    await this.setStage(context,stage);
    return {stage};
  }
}

export class CheckCredentialReadinessNode implements TaxWorkflowNode {
  readonly type="tax.check_credentials";
  constructor(private readonly check:(ctx:TaxWorkflowContext)=>Promise<{ready:boolean;blockers:string[]}>){}
  async execute(_config:Record<string,unknown>,context:TaxWorkflowContext):Promise<Record<string,unknown>>{
    return this.check(context);
  }
}
