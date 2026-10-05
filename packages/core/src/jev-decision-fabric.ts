import type { Actor, EntityRef, TenantScope } from "@mgr/legacy-contracts";
import type { ExecutionMode } from "./action-receipts.js";

export interface DecisionContext {
  tenantId:string;
  correlationId:string;
  actor:Actor;
  scope:TenantScope;
  goal:string;
  target?:EntityRef;
  executionMode:ExecutionMode;
  facts:Record<string,unknown>;
  constraints:string[];
  availableTools:string[];
  memoryRefs:string[];
}

export interface DecisionOption {
  optionId:string;
  label:string;
  action:string;
  arguments:Record<string,unknown>;
  expectedValue:number;
  confidence:number;
  risk:"low"|"medium"|"high"|"critical";
  evidence:string[];
}

export interface DecisionResult {
  selected?:DecisionOption;
  alternatives:DecisionOption[];
  explanation:string;
  requiresApproval:boolean;
}

export interface JevDecisionEngine {
  decide(context:DecisionContext):Promise<DecisionResult>;
}

export interface DeterministicAuthorization {
  authorize(input:{
    actor:Actor;
    scope:TenantScope;
    action:string;
    target?:EntityRef;
    arguments:Record<string,unknown>;
  }):Promise<{allowed:boolean;requiresApproval:boolean;reason:string}>;
}

export class GovernedDecisionFabric {
  constructor(
    private readonly engine:JevDecisionEngine,
    private readonly authorization:DeterministicAuthorization
  ){}

  async decide(context:DecisionContext):Promise<DecisionResult>{
    const result=await this.engine.decide(context);
    if(!result.selected) return result;
    const auth=await this.authorization.authorize({
      actor:context.actor,
      scope:context.scope,
      action:result.selected.action,
      target:context.target,
      arguments:result.selected.arguments
    });
    if(!auth.allowed){
      return {...result,selected:undefined,requiresApproval:false,explanation:`${result.explanation} Authorization blocked: ${auth.reason}`};
    }
    return {...result,requiresApproval:result.requiresApproval || auth.requiresApproval};
  }
}
