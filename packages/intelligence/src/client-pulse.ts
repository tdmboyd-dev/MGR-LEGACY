export interface ClientPulseSignals {
  daysSinceContact:number;
  openTasks:number;
  overdueTasks:number;
  sentiment:number;
  unresolvedIssues:number;
}

export class ClientPulse {
  evaluate(input:ClientPulseSignals):{health:number;riskReasons:string[]}{
    const reasons:string[]=[];
    let health=1;
    if(input.daysSinceContact>14){health-=0.2;reasons.push("Contact gap");}
    if(input.overdueTasks>0){health-=Math.min(0.3,input.overdueTasks*0.08);reasons.push("Overdue tasks");}
    if(input.sentiment<0){health-=0.2;reasons.push("Negative sentiment");}
    if(input.unresolvedIssues>0){health-=Math.min(0.3,input.unresolvedIssues*0.08);reasons.push("Unresolved issues");}
    return {health:Math.max(0,health),riskReasons:reasons};
  }
}
