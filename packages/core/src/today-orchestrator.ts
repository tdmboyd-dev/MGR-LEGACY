import type { EntityRef, NextAction } from "@mgr/legacy-contracts";
import { NextActionEngine, type RankedAction } from "./next-action.js";

export interface TodayTaskInput {
  id:string;
  tenantId:string;
  ownerId:string;
  subject:EntityRef;
  title:string;
  dueAt?:string;
  priority:number;
  blocked?:boolean;
}

export interface TodayLeakInput {
  id:string;
  tenantId:string;
  ownerId:string;
  subject:EntityRef;
  title:string;
  amountAtRisk:number;
  recoveryProbability:number;
  urgency:number;
}

export class TodayOrchestrator {
  private readonly engine=new NextActionEngine();

  build(ownerId:string,tasks:TodayTaskInput[],leaks:TodayLeakInput[],now=new Date()):RankedAction[] {
    const actions:NextAction[]=[];

    for(const task of tasks.filter(item=>item.ownerId===ownerId)){
      const due=task.dueAt ? new Date(task.dueAt).getTime() : null;
      const hoursToDue=due===null ? 168 : (due-now.getTime())/3_600_000;
      const urgency=due===null ? 0.25 : hoursToDue<=0 ? 1 : hoursToDue<=24 ? 0.85 : hoursToDue<=72 ? 0.6 : 0.3;
      actions.push({
        id:`task:${task.id}`,
        tenantId:task.tenantId,
        ownerId:task.ownerId,
        subject:task.subject,
        title:task.title,
        reason:task.blocked ? "Task is blocked and needs intervention" : "Open task requires attention",
        urgency,
        businessValue:Math.max(0,Math.min(1,task.priority)),
        risk:task.blocked ? 0.7 : 0.25,
        confidence:1,
        effort:0.4,
        dueAt:task.dueAt,
        blockers:task.blocked ? ["blocked"] : []
      });
    }

    for(const leak of leaks.filter(item=>item.ownerId===ownerId)){
      const normalizedValue=Math.min(1,Math.log10(Math.max(1,leak.amountAtRisk))/5);
      actions.push({
        id:`leak:${leak.id}`,
        tenantId:leak.tenantId,
        ownerId:leak.ownerId,
        subject:leak.subject,
        title:leak.title,
        reason:`Revenue at risk: $${leak.amountAtRisk.toFixed(2)}`,
        urgency:Math.max(0,Math.min(1,leak.urgency)),
        businessValue:normalizedValue,
        risk:Math.max(0,Math.min(1,leak.recoveryProbability)),
        confidence:Math.max(0,Math.min(1,leak.recoveryProbability)),
        effort:0.35,
        blockers:[]
      });
    }

    return this.engine.rank(actions);
  }
}
