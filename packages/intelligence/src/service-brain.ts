export interface ServiceCaseInput {
  ageHours: number;
  slaHours: number;
  priority: number;
  reopenCount: number;
  customerHealth: number;
  unresolvedDependencies: number;
}

export interface ServiceCaseDecision {
  escalationScore: number;
  breachRisk: "low" | "medium" | "high";
  actions: string[];
}

export class ServiceBrain {
  triage(input: ServiceCaseInput): ServiceCaseDecision {
    const slaPressure = input.slaHours <= 0 ? 1 : Math.min(1, input.ageHours / input.slaHours);
    const priority = Math.max(0, Math.min(1, input.priority));
    const poorHealth = 1 - Math.max(0, Math.min(1, input.customerHealth));
    const reopenPenalty = Math.min(0.2, input.reopenCount * 0.05);
    const dependencyPenalty = Math.min(0.2, input.unresolvedDependencies * 0.05);

    const score = Math.min(1,
      slaPressure * 0.4 +
      priority * 0.25 +
      poorHealth * 0.2 +
      reopenPenalty +
      dependencyPenalty
    );

    const actions: string[] = [];
    if (score >= 0.75) actions.push("Escalate to senior owner");
    if (slaPressure >= 0.8) actions.push("Prioritize before SLA breach");
    if (input.unresolvedDependencies > 0) actions.push("Resolve blocking dependencies");
    if (input.reopenCount > 1) actions.push("Perform root-cause review");

    return {
      escalationScore: Number(score.toFixed(4)),
      breachRisk: score >= 0.75 ? "high" : score >= 0.45 ? "medium" : "low",
      actions
    };
  }
}
