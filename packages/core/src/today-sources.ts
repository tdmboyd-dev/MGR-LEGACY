import type { EntityRef, NextAction } from "@mgr/legacy-contracts";
import { NextActionEngine, type RankedAction } from "./next-action.js";

export interface TodaySource {
  collect(ownerId:string,now:Date):Promise<NextAction[]>;
}

export class TodayFeed {
  private readonly ranker=new NextActionEngine();

  constructor(private readonly sources:TodaySource[]){}

  async build(ownerId:string,now=new Date()):Promise<RankedAction[]>{
    const groups=await Promise.all(this.sources.map(source=>source.collect(ownerId,now)));
    const unique=new Map<string,NextAction>();

    for(const action of groups.flat()){
      const existing=unique.get(action.id);
      if(!existing){
        unique.set(action.id,action);
        continue;
      }

      const merged:NextAction={
        ...existing,
        urgency:Math.max(existing.urgency,action.urgency),
        businessValue:Math.max(existing.businessValue,action.businessValue),
        risk:Math.max(existing.risk,action.risk),
        confidence:Math.max(existing.confidence,action.confidence),
        effort:Math.min(existing.effort,action.effort),
        blockers:[...new Set([...existing.blockers,...action.blockers])],
        reason:[existing.reason,action.reason].filter((value,index,array)=>array.indexOf(value)===index).join(" | ")
      };
      unique.set(action.id,merged);
    }

    return this.ranker.rank([...unique.values()]);
  }
}

export interface ConversationIntervention {
  id:string;
  tenantId:string;
  ownerId:string;
  subject:EntityRef;
  title:string;
  reason:string;
  priority:number;
  confidence:number;
}

export class ConversationTodaySource implements TodaySource {
  constructor(private readonly load:(ownerId:string)=>Promise<ConversationIntervention[]>){}

  async collect(ownerId:string):Promise<NextAction[]>{
    const rows=await this.load(ownerId);
    return rows.map(row=>({
      id:`conversation:${row.id}`,
      tenantId:row.tenantId,
      ownerId:row.ownerId,
      subject:row.subject,
      title:row.title,
      reason:row.reason,
      urgency:row.priority,
      businessValue:0.55,
      risk:row.priority,
      confidence:row.confidence,
      effort:0.25,
      blockers:[]
    }));
  }
}

export interface WorkflowIntervention {
  id:string;
  tenantId:string;
  ownerId:string;
  subject:EntityRef;
  workflowName:string;
  healthScore:number;
  failureRate:number;
}

export class WorkflowTodaySource implements TodaySource {
  constructor(private readonly load:(ownerId:string)=>Promise<WorkflowIntervention[]>){}

  async collect(ownerId:string):Promise<NextAction[]>{
    const rows=await this.load(ownerId);
    return rows
      .filter(row=>row.healthScore<0.9 || row.failureRate>0.05)
      .map(row=>({
        id:`workflow:${row.id}`,
        tenantId:row.tenantId,
        ownerId:row.ownerId,
        subject:row.subject,
        title:`Fix automation: ${row.workflowName}`,
        reason:`Workflow health ${Math.round(row.healthScore*100)}%; failure rate ${Math.round(row.failureRate*100)}%`,
        urgency:Math.min(1,Math.max(0.4,row.failureRate*2)),
        businessValue:0.65,
        risk:1-row.healthScore,
        confidence:1,
        effort:0.45,
        blockers:[]
      }));
  }
}

export interface ComplianceIntervention {
  id:string;
  tenantId:string;
  ownerId:string;
  subject:EntityRef;
  title:string;
  severity:number;
  dueAt?:string;
  reason:string;
}

export class ComplianceTodaySource implements TodaySource {
  constructor(private readonly load:(ownerId:string)=>Promise<ComplianceIntervention[]>){}

  async collect(ownerId:string,now:Date):Promise<NextAction[]>{
    const rows=await this.load(ownerId);
    return rows.map(row=>{
      const due=row.dueAt ? new Date(row.dueAt).getTime()-now.getTime() : null;
      const dueUrgency=due===null ? 0.5 : due<=0 ? 1 : due<=86_400_000 ? 0.9 : due<=3*86_400_000 ? 0.7 : 0.5;
      return {
        id:`compliance:${row.id}`,
        tenantId:row.tenantId,
        ownerId:row.ownerId,
        subject:row.subject,
        title:row.title,
        reason:row.reason,
        urgency:Math.max(dueUrgency,row.severity),
        businessValue:0.4,
        risk:row.severity,
        confidence:1,
        effort:0.4,
        dueAt:row.dueAt,
        blockers:[]
      };
    });
  }
}
