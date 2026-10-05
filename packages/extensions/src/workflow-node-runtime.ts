export interface CustomWorkflowNodeContext {
  tenantId:string;
  runId:string;
  nodeId:string;
  actorId?:string;
  input:Record<string,unknown>;
}

export interface CustomWorkflowNodeHandler {
  type:string;
  execute(config:Record<string,unknown>,context:CustomWorkflowNodeContext):Promise<Record<string,unknown>>;
}

export class CustomWorkflowNodeRegistry {
  private readonly handlers=new Map<string,CustomWorkflowNodeHandler>();

  register(handler:CustomWorkflowNodeHandler):void{
    if(this.handlers.has(handler.type)) throw new Error(`Workflow node handler exists: ${handler.type}`);
    this.handlers.set(handler.type,handler);
  }

  async execute(type:string,config:Record<string,unknown>,context:CustomWorkflowNodeContext):Promise<Record<string,unknown>>{
    const handler=this.handlers.get(type);
    if(!handler) throw new Error(`Unknown workflow node type: ${type}`);
    return handler.execute(config,context);
  }

  types():string[]{ return [...this.handlers.keys()].sort(); }
}
