import type { RevenueLeakCandidate } from "./revenue-leak.js";
import type { ForecastInput } from "./forecast.js";

export interface OpportunitySnapshot {
  id:string;
  tenantId:string;
  ownerId:string;
  value:number;
  probability:number;
  stageProbability:number;
  daysSinceActivity:number;
  expectedCloseAt?:string;
  hasNextStep:boolean;
  engagementScore?:number;
  activityRecencyScore?:number;
  conversationCommitmentScore?:number;
}

export class OpportunityLeakSource {
  find(rows:OpportunitySnapshot[]):RevenueLeakCandidate[]{
    return rows.flatMap(row=>{
      const leaks:RevenueLeakCandidate[]=[];
      if(row.daysSinceActivity>14){
        leaks.push({
          id:`stalled:${row.id}`,
          tenantId:row.tenantId,
          subjectType:"opportunity",
          subjectId:row.id,
          type:"stalled_opportunity",
          amountAtRisk:row.value,
          probabilityRecoverable:Math.max(0.1,Math.min(0.9,row.probability)),
          urgency:Math.min(1,0.5+row.daysSinceActivity/60),
          ownerId:row.ownerId,
          evidence:{daysSinceActivity:row.daysSinceActivity}
        });
      }
      if(!row.hasNextStep && row.value>0){
        leaks.push({
          id:`followup:${row.id}`,
          tenantId:row.tenantId,
          subjectType:"opportunity",
          subjectId:row.id,
          type:"missed_follow_up",
          amountAtRisk:row.value,
          probabilityRecoverable:Math.max(0.1,Math.min(0.9,row.probability)),
          urgency:0.75,
          ownerId:row.ownerId,
          evidence:{hasNextStep:false}
        });
      }
      return leaks;
    });
  }
}

export function opportunityToForecastInput(row:OpportunitySnapshot):ForecastInput{
  return {
    amount:row.value,
    stageProbability:row.stageProbability,
    engagementScore:row.engagementScore,
    activityRecencyScore:row.activityRecencyScore,
    conversationCommitmentScore:row.conversationCommitmentScore
  };
}
