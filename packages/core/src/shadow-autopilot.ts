import type { ExecutionMode } from "./action-receipts.js";

export interface AutonomySignals {
  successfulRuns:number;
  failedRuns:number;
  blockedRuns:number;
  approvalOverrideRate:number;
  rollbackRate:number;
  criticalIncidents:number;
  evidenceCoverage:number;
}

export interface GraduationDecision {
  current:ExecutionMode;
  recommended:ExecutionMode;
  eligible:boolean;
  reasons:string[];
}

const ORDER:ExecutionMode[]=["observe","recommend","draft","ask","limited","autonomous"];

export class ShadowAutopilot {
  evaluate(current:ExecutionMode,signals:AutonomySignals):GraduationDecision{
    const reasons:string[]=[];
    const total=signals.successfulRuns+signals.failedRuns+signals.blockedRuns;
    const successRate=total===0 ? 0 : signals.successfulRuns/total;

    if(total<25) reasons.push("At least 25 observed runs are required");
    if(successRate<0.98) reasons.push("Success rate must be at least 98%");
    if(signals.approvalOverrideRate>0.02) reasons.push("Approval override rate must be 2% or lower");
    if(signals.rollbackRate>0.01) reasons.push("Rollback rate must be 1% or lower");
    if(signals.criticalIncidents>0) reasons.push("Critical incidents must be zero");
    if(signals.evidenceCoverage<0.99) reasons.push("Evidence coverage must be at least 99%");

    const index=ORDER.indexOf(current);
    const recommended=ORDER[Math.min(ORDER.length-1,index+1)]!;
    return {
      current,
      recommended,
      eligible:reasons.length===0 && current!=="autonomous",
      reasons
    };
  }

  canExecute(mode:ExecutionMode,risk:"low"|"medium"|"high"|"critical"):boolean{
    if(mode==="observe" || mode==="recommend" || mode==="draft") return false;
    if(mode==="ask") return false;
    if(mode==="limited") return risk==="low";
    return risk!=="critical";
  }
}
