export interface RetryPolicy {
  maxAttempts:number;
  initialDelayMs:number;
  maxDelayMs:number;
  backoffMultiplier:number;
  retryableErrors?:string[];
}

export interface ExecutionCheckpoint {
  runId:string;
  workflowId:string;
  workflowVersion:number;
  nodeId:string;
  attempt:number;
  status:"pending"|"running"|"succeeded"|"failed"|"waiting";
  input?:Record<string,unknown>;
  output?:Record<string,unknown>;
  error?:string;
  nextAttemptAt?:string;
  updatedAt:string;
}

export interface ReplayRequest {
  sourceRunId:string;
  workflowId:string;
  workflowVersion:number;
  fromNodeId?:string;
  reason:string;
  requestedBy:string;
  requestedAt:string;
}

export class RetryPlanner {
  nextAttempt(
    attempt:number,
    policy:RetryPolicy,
    now=new Date()
  ):{retry:boolean;delayMs:number;nextAttemptAt?:string}{
    if(attempt>=policy.maxAttempts){
      return {retry:false,delayMs:0};
    }

    const raw=policy.initialDelayMs*Math.pow(policy.backoffMultiplier,Math.max(0,attempt-1));
    const delayMs=Math.min(policy.maxDelayMs,Math.max(0,Math.round(raw)));

    return {
      retry:true,
      delayMs,
      nextAttemptAt:new Date(now.getTime()+delayMs).toISOString()
    };
  }

  isRetryable(error:string,policy:RetryPolicy):boolean{
    if(!policy.retryableErrors?.length) return true;
    return policy.retryableErrors.some(token=>error.toLowerCase().includes(token.toLowerCase()));
  }
}

export class CheckpointLedger {
  private readonly rows=new Map<string,ExecutionCheckpoint>();

  private key(runId:string,nodeId:string):string{
    return `${runId}:${nodeId}`;
  }

  save(checkpoint:ExecutionCheckpoint):void{
    this.rows.set(this.key(checkpoint.runId,checkpoint.nodeId),structuredClone(checkpoint));
  }

  get(runId:string,nodeId:string):ExecutionCheckpoint|null{
    return structuredClone(this.rows.get(this.key(runId,nodeId)) ?? null);
  }

  listRun(runId:string):ExecutionCheckpoint[]{
    return structuredClone(
      [...this.rows.values()]
        .filter(row=>row.runId===runId)
        .sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt))
    );
  }

  resumeCandidates(runId:string,now=new Date()):ExecutionCheckpoint[]{
    return this.listRun(runId).filter(row=>{
      if(row.status==="pending") return true;
      if(row.status!=="waiting" || !row.nextAttemptAt) return false;
      return new Date(row.nextAttemptAt)<=now;
    });
  }
}
