export interface DealCoachingInput {
  amount: number;
  daysSinceActivity: number;
  stakeholderCount: number;
  hasDecisionMaker: boolean;
  nextStepScheduled: boolean;
  objectionCount: number;
  stageProbability: number;
}

export interface DealCoachingResult {
  riskScore: number;
  findings: string[];
  recommendedActions: string[];
}

export class DealCoach {
  analyze(input: DealCoachingInput): DealCoachingResult {
    const findings: string[] = [];
    const recommendedActions: string[] = [];
    let risk = 0;

    if (input.daysSinceActivity > 14) {
      risk += 0.28;
      findings.push("Opportunity has gone stale");
      recommendedActions.push("Create an immediate follow-up task");
    } else if (input.daysSinceActivity > 7) {
      risk += 0.14;
      findings.push("Opportunity activity is slowing");
    }

    if (!input.hasDecisionMaker) {
      risk += 0.22;
      findings.push("No confirmed decision maker");
      recommendedActions.push("Identify and engage the decision maker");
    }

    if (!input.nextStepScheduled) {
      risk += 0.2;
      findings.push("No committed next step");
      recommendedActions.push("Schedule a concrete next step with a date");
    }

    if (input.stakeholderCount < 2 && input.amount >= 5000) {
      risk += 0.12;
      findings.push("Large opportunity is single-threaded");
      recommendedActions.push("Add another stakeholder to reduce single-thread risk");
    }

    if (input.objectionCount > 0) {
      risk += Math.min(0.12, input.objectionCount * 0.04);
      findings.push("Open objections remain unresolved");
      recommendedActions.push("Document and resolve the highest-impact objection");
    }

    const probabilityMismatch = input.stageProbability > 0.7 && risk > 0.45;
    if (probabilityMismatch) {
      findings.push("Stage probability appears optimistic versus deal evidence");
      recommendedActions.push("Review forecast probability");
    }

    return {
      riskScore: Number(Math.min(1, risk).toFixed(4)),
      findings,
      recommendedActions: [...new Set(recommendedActions)]
    };
  }
}
