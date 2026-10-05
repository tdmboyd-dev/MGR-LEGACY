export interface SubagentDefinition {
  id:string;
  role:string;
  goal:string;
  allowedTools:string[];
  maxDelegationDepth:number;
  memoryCollection?:string;
}

export interface AgentCollection {
  id:string;
  tenantId:string;
  name:string;
  members:string[];
  sharedMemoryRefs:string[];
}

export class DelegationGuard {
  canDelegate(parentDepth:number,definition:SubagentDefinition):boolean{
    return parentDepth < definition.maxDelegationDepth;
  }
}
