import type { WorkflowDefinition } from "@mgr/legacy-contracts";

export interface WorkflowRepository {
  save(definition:WorkflowDefinition):Promise<void>;
  get(workflowId:string,version:number):Promise<WorkflowDefinition|null>;
  latest(workflowId:string):Promise<WorkflowDefinition|null>;
  activate(workflowId:string,version:number):Promise<void>;
  retire(workflowId:string,version:number):Promise<void>;
  list(status?:WorkflowDefinition["status"]):Promise<WorkflowDefinition[]>;
}

export class InMemoryWorkflowRepository implements WorkflowRepository {
  private readonly rows=new Map<string,WorkflowDefinition>();

  private key(id:string,version:number):string { return `${id}@${version}`; }

  async save(definition:WorkflowDefinition):Promise<void> {
    const key=this.key(definition.workflowId,definition.version);
    if(this.rows.has(key)) throw new Error(`Workflow version exists: ${key}`);
    this.rows.set(key,structuredClone(definition));
  }

  async get(workflowId:string,version:number):Promise<WorkflowDefinition|null> {
    return structuredClone(this.rows.get(this.key(workflowId,version)) ?? null);
  }

  async latest(workflowId:string):Promise<WorkflowDefinition|null> {
    const rows=[...this.rows.values()].filter(row=>row.workflowId===workflowId).sort((a,b)=>b.version-a.version);
    return structuredClone(rows[0] ?? null);
  }

  async activate(workflowId:string,version:number):Promise<void> {
    const target=await this.get(workflowId,version);
    if(!target) throw new Error("Workflow version not found");
    for(const [key,row] of this.rows) {
      if(row.workflowId===workflowId && row.status==="active") this.rows.set(key,{...row,status:"retired"});
    }
    this.rows.set(this.key(workflowId,version),{...target,status:"active"});
  }

  async retire(workflowId:string,version:number):Promise<void> {
    const target=await this.get(workflowId,version);
    if(!target) throw new Error("Workflow version not found");
    this.rows.set(this.key(workflowId,version),{...target,status:"retired"});
  }

  async list(status?:WorkflowDefinition["status"]):Promise<WorkflowDefinition[]> {
    const rows=[...this.rows.values()].filter(row=>!status || row.status===status);
    return structuredClone(rows);
  }
}

export class WorkflowVersionService {
  constructor(private readonly repository:WorkflowRepository) {}

  async stage(input:Omit<WorkflowDefinition,"version"|"status">):Promise<WorkflowDefinition> {
    const latest=await this.repository.latest(input.workflowId);
    const definition:WorkflowDefinition={...input,version:(latest?.version ?? 0)+1,status:"staged"};
    await this.repository.save(definition);
    return definition;
  }

  async activate(workflowId:string,version:number):Promise<WorkflowDefinition> {
    await this.repository.activate(workflowId,version);
    const result=await this.repository.get(workflowId,version);
    if(!result) throw new Error("Workflow activation failed");
    return result;
  }

  async replaySource(workflowId:string,version:number):Promise<WorkflowDefinition> {
    const source=await this.repository.get(workflowId,version);
    if(!source) throw new Error("Workflow version not found");
    return source;
  }
}
