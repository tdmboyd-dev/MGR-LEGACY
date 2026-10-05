export interface WorkflowRunSample {
  workflowId: string;
  succeeded: boolean;
  durationMs: number;
  retries: number;
  cost: number;
  providerErrors: number;
}

export interface WorkflowHealth {
  workflowId: string;
  score: number;
  successRate: number;
  retryRate: number;
  providerErrorRate: number;
  avgDurationMs: number;
  avgCost: number;
  warnings: string[];
}

export class AutomationSelfAudit {
  evaluate(samples: WorkflowRunSample[]): WorkflowHealth[] {
    const groups = new Map<string, WorkflowRunSample[]>();
    for (const sample of samples) groups.set(sample.workflowId, [...(groups.get(sample.workflowId) ?? []), sample]);

    return [...groups.entries()].map(([workflowId, rows]) => {
      const count = rows.length;
      const successRate = rows.filter((row) => row.succeeded).length / count;
      const retryRate = rows.filter((row) => row.retries > 0).length / count;
      const providerErrorRate = rows.filter((row) => row.providerErrors > 0).length / count;
      const avgDurationMs = rows.reduce((sum, row) => sum + row.durationMs, 0) / count;
      const avgCost = rows.reduce((sum, row) => sum + row.cost, 0) / count;
      const score = Math.max(0, Math.min(1, successRate * 0.65 + (1 - retryRate) * 0.15 + (1 - providerErrorRate) * 0.2));
      const warnings: string[] = [];
      if (successRate < 0.95) warnings.push("Success rate below 95%");
      if (retryRate > 0.15) warnings.push("High retry rate");
      if (providerErrorRate > 0.05) warnings.push("Provider error rate above 5%");
      return { workflowId, score: Number(score.toFixed(4)), successRate, retryRate, providerErrorRate, avgDurationMs, avgCost, warnings };
    });
  }
}
