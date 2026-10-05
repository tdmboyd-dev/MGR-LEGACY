import type { WorkflowDefinition } from "@mgr/legacy-contracts";
import { AutomationConflictDetector } from "./conflicts.js";
import { validateWorkflow } from "./graph.js";
import type { WorkflowRepository } from "./repository.js";

export class WorkflowActivationService {
  private readonly conflicts=new AutomationConflictDetector();

  constructor(private readonly repository:WorkflowRepository){}

  async activate(workflowId:string,version:number):Promise<WorkflowDefinition>{
    const workflow=await this.repository.get(workflowId,version);
    if(!workflow) throw new Error("Workflow version not found");

    const validation=validateWorkflow(workflow);
    if(!validation.valid){
      throw new Error(`Workflow invalid: ${validation.errors.join("; ")}`);
    }

    const others=(await this.repository.list()).filter(item=>!(
      item.workflowId===workflow.workflowId && item.version===workflow.version
    ));
    const safety=this.conflicts.canActivate(workflow,others);

    if(!safety.allowed){
      throw new Error(
        `Workflow activation blocked: ${safety.conflicts.map(item=>item.details).join("; ")}`
      );
    }

    await this.repository.activate(workflowId,version);
    const active=await this.repository.get(workflowId,version);
    if(!active) throw new Error("Workflow activation failed");
    return active;
  }
}
