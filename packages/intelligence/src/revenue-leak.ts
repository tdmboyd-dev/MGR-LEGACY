export type LeakType =
  | "stale_lead"
  | "missed_follow_up"
  | "stalled_opportunity"
  | "unsigned_proposal"
  | "unpaid_invoice"
  | "renewal_risk"
  | "failed_automation"
  | "missing_documents"
  | "unfunded_bank_product";

export interface RevenueLeakCandidate {
  id: string;
  tenantId: string;
  subjectType: string;
  subjectId: string;
  type: LeakType;
  amountAtRisk: number;
  probabilityRecoverable: number;
  urgency: number;
  ownerId?: string;
  evidence: Record<string, unknown>;
}

export interface RankedRevenueLeak extends RevenueLeakCandidate {
  recoveryValue: number;
  priorityScore: number;
}

export class RevenueLeakScanner {
  rank(candidates: RevenueLeakCandidate[]): RankedRevenueLeak[] {
    return candidates
      .map((candidate) => {
        const recoveryValue = candidate.amountAtRisk * candidate.probabilityRecoverable;
        const priorityScore = recoveryValue * (0.5 + candidate.urgency * 0.5);
        return {
          ...candidate,
          recoveryValue: Number(recoveryValue.toFixed(2)),
          priorityScore: Number(priorityScore.toFixed(2))
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
