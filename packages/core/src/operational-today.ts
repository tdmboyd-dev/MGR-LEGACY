import type { EntityRef, NextAction } from "@mgr/legacy-contracts";
import type { TodaySource } from "./today-sources.js";

export interface WaitingWorkflowSignal {
  runId:string;
  tenantId:string;
  ownerId:string;
  workflowName:string;
  subject:EntityRef;
  retryAt?:string;
  lastError?:string;
  retries:number;
}

export class WaitingWorkflowTodaySource implements TodaySource {
  constructor(
    private readonly load:(ownerId:string)=>Promise<WaitingWorkflowSignal[]>
  ) {}

  async collect(ownerId:string,now:Date):Promise<NextAction[]>{
    const rows=await this.load(ownerId);

    return rows.map(row=>{
      const overdue=row.retryAt ? new Date(row.retryAt)<=now : false;
      return {
        id:`waiting-workflow:${row.runId}`,
        tenantId:row.tenantId,
        ownerId:row.ownerId,
        subject:row.subject,
        title:`Automation waiting: ${row.workflowName}`,
        reason:row.lastError ?? "Workflow is waiting to resume",
        urgency:overdue ? 0.95 : 0.7,
        businessValue:0.7,
        risk:Math.min(1,0.45+row.retries*0.1),
        confidence:1,
        effort:0.35,
        dueAt:row.retryAt,
        blockers:[]
      };
    });
  }
}

export interface ProviderIncidentSignal {
  id:string;
  tenantId:string;
  ownerId:string;
  providerKey:string;
  channel:string;
  subject:EntityRef;
  consecutiveFailures:number;
  circuitOpen:boolean;
}

export class ProviderIncidentTodaySource implements TodaySource {
  constructor(
    private readonly load:(ownerId:string)=>Promise<ProviderIncidentSignal[]>
  ) {}

  async collect(ownerId:string):Promise<NextAction[]>{
    const rows=await this.load(ownerId);

    return rows.map(row=>({
      id:`provider-incident:${row.id}`,
      tenantId:row.tenantId,
      ownerId:row.ownerId,
      subject:row.subject,
      title:`${row.channel.toUpperCase()} provider issue: ${row.providerKey}`,
      reason:row.circuitOpen
        ? `Circuit is open after ${row.consecutiveFailures} failure(s)`
        : `${row.consecutiveFailures} consecutive provider failure(s)`,
      urgency:row.circuitOpen ? 1 : Math.min(0.95,0.55+row.consecutiveFailures*0.1),
      businessValue:0.75,
      risk:row.circuitOpen ? 1 : Math.min(0.9,0.5+row.consecutiveFailures*0.08),
      confidence:1,
      effort:0.3,
      blockers:[]
    }));
  }
}
