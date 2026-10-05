import type { RetryPolicy } from "./durability.js";
import type { DurableWorkflowRunner } from "./durable-runner.js";
import type { WorkflowDefinition } from "@mgr/legacy-contracts";
import type { WorkflowExecutionContext } from "./runtime.js";

export interface ResumeCheckpointRepository {
  listResumeCandidates(now?:Date,limit?:number):Promise<Array<{
    runId:string;
    workflowId:string;
    workflowVersion:number;
    nodeId:string;
  }>>;
}

export interface ResumeWorkflowRepository {
  get(workflowId:string,version:number):Promise<WorkflowDefinition|null>;
}

export interface ResumeContextLoader {
  load(runId:string):Promise<WorkflowExecutionContext|null>;
}

export class WorkflowResumeWorker {
  constructor(
    private readonly checkpoints:ResumeCheckpointRepository,
    private readonly workflows:ResumeWorkflowRepository,
    private readonly contexts:ResumeContextLoader,
    private readonly runner:DurableWorkflowRunner,
    private readonly retryPolicy:RetryPolicy
  ) {}

  async runOnce(limit=100,now=new Date()):Promise<{
    scanned:number;
    resumed:number;
    failed:number;
    failures:Array<{runId:string;reason:string}>;
  }>{
    const candidates=await this.checkpoints.listResumeCandidates(now,limit);
    let resumed=0;
    let failed=0;
    const failures:Array<{runId:string;reason:string}>=[];

    for(const candidate of candidates){
      try{
        const workflow=await this.workflows.get(candidate.workflowId,candidate.workflowVersion);
        const context=await this.contexts.load(candidate.runId);

        if(!workflow) throw new Error("Workflow definition not found");
        if(!context) throw new Error("Workflow execution context not found");

        await this.runner.run(workflow,context,this.retryPolicy);
        resumed+=1;
      }catch(error){
        failed+=1;
        failures.push({
          runId:candidate.runId,
          reason:error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {scanned:candidates.length,resumed,failed,failures};
  }
}
