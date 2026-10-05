export interface DealRoomStakeholder {
  contactId:string;
  role:string;
  influence:number;
  decisionMaker:boolean;
}

export interface DealRoomObjection {
  id:string;
  category:string;
  text:string;
  status:"open"|"resolved";
  severity:number;
}

export interface DealRoomNextStep {
  id:string;
  title:string;
  ownerId:string;
  dueAt?:string;
  completed:boolean;
}

export interface DealRoomSnapshot {
  opportunityId:string;
  tenantId:string;
  value:number;
  probability:number;
  stakeholders:DealRoomStakeholder[];
  objections:DealRoomObjection[];
  nextSteps:DealRoomNextStep[];
  lastActivityAt?:string;
  proposalStatus?:"none"|"draft"|"sent"|"viewed"|"signed"|"declined";
}

export interface DealRoomHealth {
  score:number;
  risks:string[];
  strengths:string[];
  recommendedActions:string[];
}

export class DealRoomEngine {
  assess(room:DealRoomSnapshot,now=new Date()):DealRoomHealth{
    let score=1;
    const risks:string[]=[];
    const strengths:string[]=[];
    const recommendedActions:string[]=[];

    const decisionMaker=room.stakeholders.some(item=>item.decisionMaker);
    if(!decisionMaker){
      score-=0.18;
      risks.push("No confirmed decision maker");
      recommendedActions.push("Identify and engage the decision maker");
    } else {
      strengths.push("Decision maker engaged");
    }

    if(room.stakeholders.length<2 && room.value>=5000){
      score-=0.12;
      risks.push("Large opportunity is single-threaded");
      recommendedActions.push("Add another stakeholder");
    }

    const openObjections=room.objections.filter(item=>item.status==="open");
    if(openObjections.length){
      const severity=Math.min(0.22,openObjections.reduce((sum,item)=>sum+item.severity,0)*0.06);
      score-=severity;
      risks.push(`${openObjections.length} unresolved objection(s)`);
      recommendedActions.push("Resolve highest-severity objection");
    } else {
      strengths.push("No unresolved objections");
    }

    const openSteps=room.nextSteps.filter(item=>!item.completed);
    if(!openSteps.length){
      score-=0.2;
      risks.push("No committed next step");
      recommendedActions.push("Schedule a concrete next step");
    }

    if(room.lastActivityAt){
      const days=(now.getTime()-new Date(room.lastActivityAt).getTime())/86_400_000;
      if(days>14){
        score-=0.2;
        risks.push("Deal is stale");
        recommendedActions.push("Re-engage immediately");
      } else if(days<=3){
        strengths.push("Recent activity");
      }
    }

    if(room.proposalStatus==="signed") strengths.push("Proposal signed");
    if(room.proposalStatus==="viewed") strengths.push("Proposal viewed");
    if(room.proposalStatus==="declined"){
      score-=0.3;
      risks.push("Proposal declined");
      recommendedActions.push("Run win-back / objection review");
    }

    return {
      score:Number(Math.max(0,Math.min(1,score)).toFixed(4)),
      risks,
      strengths,
      recommendedActions:[...new Set(recommendedActions)]
    };
  }
}
