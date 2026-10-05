export interface ApprovalRequest {
  id:string;
  runId:string;
  nodeId:string;
  tenantId:string;
  requestedBy:string;
  approverRoles:string[];
  minimumApprovals:number;
  status:"pending"|"approved"|"denied"|"cancelled";
  approvals:string[];
  denials:string[];
  createdAt:string;
}

export class ApprovalGate {
  decide(request:ApprovalRequest,actorId:string,decision:"approve"|"deny"):ApprovalRequest{
    if(request.status!=="pending") throw new Error("Approval request is not pending");
    const approvals=[...request.approvals];
    const denials=[...request.denials];
    if(decision==="approve" && !approvals.includes(actorId)) approvals.push(actorId);
    if(decision==="deny" && !denials.includes(actorId)) denials.push(actorId);
    let status:ApprovalRequest["status"]="pending";
    if(denials.length>0) status="denied";
    else if(approvals.length>=request.minimumApprovals) status="approved";
    return {...request,approvals,denials,status};
  }
}

export interface SubflowInvocation {
  parentRunId:string;
  parentNodeId:string;
  workflowId:string;
  workflowVersion:number;
  input:Record<string,unknown>;
}

export interface ParallelBranch<T> {
  key:string;
  run:()=>Promise<T>;
}

export async function runParallel<T>(branches:ParallelBranch<T>[]):Promise<Record<string,T>>{
  const entries=await Promise.all(branches.map(async branch=>[branch.key,await branch.run()] as const));
  return Object.fromEntries(entries);
}
