export interface Goal {
  id:string;
  tenantId:string;
  scopeType:string;
  scopeId:string;
  metricKey:string;
  target:number;
  periodStart:string;
  periodEnd:string;
}

export interface GoalProgress {
  goalId:string;
  actual:number;
  target:number;
  progress:number;
  status:"behind"|"on_track"|"achieved";
}

export class GoalEngine {
  evaluate(goal:Goal,actual:number):GoalProgress{
    const progress=goal.target===0 ? 1 : actual/goal.target;
    return {
      goalId:goal.id,
      actual,
      target:goal.target,
      progress,
      status:progress>=1 ? "achieved" : progress>=0.8 ? "on_track" : "behind"
    };
  }
}

export interface AutomationCostBenefit {
  workflowId:string;
  executions:number;
  directCost:number;
  recoveredRevenue:number;
  generatedRevenue:number;
  laborHoursSaved:number;
  hourlyLaborValue:number;
}

export class AutomationRoiEngine {
  evaluate(input:AutomationCostBenefit):{
    grossBenefit:number;
    netBenefit:number;
    roi:number;
    valuePerExecution:number;
  }{
    const laborValue=input.laborHoursSaved*input.hourlyLaborValue;
    const grossBenefit=input.recoveredRevenue+input.generatedRevenue+laborValue;
    const netBenefit=grossBenefit-input.directCost;
    const roi=input.directCost===0 ? (grossBenefit>0 ? Infinity : 0) : netBenefit/input.directCost;
    return {
      grossBenefit,
      netBenefit,
      roi,
      valuePerExecution:input.executions===0 ? 0 : netBenefit/input.executions
    };
  }
}

export interface AgentContributionInput {
  agentId:string;
  actions:number;
  acceptedActions:number;
  revenueInfluenced:number;
  timeSavedHours:number;
  errorCount:number;
}

export class AgentContributionEngine {
  score(input:AgentContributionInput):number{
    const acceptance=input.actions===0 ? 0 : input.acceptedActions/input.actions;
    const errorPenalty=Math.min(0.4,input.errorCount*0.05);
    const revenueScore=Math.min(1,input.revenueInfluenced/10000);
    const timeScore=Math.min(1,input.timeSavedHours/40);
    return Math.max(0,Math.min(1,acceptance*0.45+revenueScore*0.3+timeScore*0.25-errorPenalty));
  }
}
