export interface FlowObservation {
  workflowId:string;
  executions:number;
  failures:number;
  avgDurationMs:number;
  avgCost:number;
  manualInterventions:number;
}

export class FlowGenius {
  diagnose(input:FlowObservation):string[]{
    const findings:string[]=[];
    const failureRate=input.executions===0?0:input.failures/input.executions;
    const interventionRate=input.executions===0?0:input.manualInterventions/input.executions;
    if(failureRate>0.02) findings.push("Failure rate exceeds 2%");
    if(interventionRate>0.1) findings.push("Manual intervention exceeds 10%");
    if(input.avgDurationMs>60_000) findings.push("Average duration exceeds 60 seconds");
    if(input.avgCost>1) findings.push("Average execution cost exceeds $1");
    return findings;
  }
}
