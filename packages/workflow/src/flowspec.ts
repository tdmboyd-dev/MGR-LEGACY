import type { WorkflowDefinition } from "@mgr/legacy-contracts";

export interface FlowSpec {
  specVersion:"1.0";
  workflow:WorkflowDefinition;
  purpose:string;
  owner:string;
  riskTier:"low"|"medium"|"high"|"critical";
  executionMode:"observe"|"recommend"|"draft"|"ask"|"limited"|"autonomous";
  invariants:string[];
  successCriteria:string[];
  rollbackStrategy?:string;
  evidenceRequirements:string[];
  costBudget?:{currency:string;maxPerRun:number};
}

export class FlowSpecValidator {
  validate(spec:FlowSpec):string[]{
    const errors:string[]=[];
    if(spec.specVersion!=="1.0") errors.push("Unsupported FlowSpec version");
    if(!spec.purpose.trim()) errors.push("Purpose is required");
    if(!spec.owner.trim()) errors.push("Owner is required");
    if(spec.riskTier==="critical" && spec.executionMode==="autonomous"){
      errors.push("Critical workflows cannot run autonomously");
    }
    if(!spec.invariants.length) errors.push("At least one invariant is required");
    if(!spec.successCriteria.length) errors.push("At least one success criterion is required");
    if(!spec.evidenceRequirements.length) errors.push("At least one evidence requirement is required");
    if(spec.costBudget && spec.costBudget.maxPerRun<0) errors.push("Cost budget cannot be negative");
    return errors;
  }
}
