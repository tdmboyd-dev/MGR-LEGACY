import type { NextAction } from "@mgr/legacy-contracts";

export interface RankedAction extends NextAction {
  rankScore: number;
}

export class NextActionEngine {
  rank(actions: NextAction[]): RankedAction[] {
    return actions
      .map((action) => ({ ...action, rankScore: this.score(action) }))
      .sort((a, b) => b.rankScore - a.rankScore);
  }

  score(action: NextAction): number {
    const blockerPenalty = Math.min(action.blockers.length * 0.12, 0.48);
    const raw =
      action.urgency * 0.28 +
      action.businessValue * 0.30 +
      action.risk * 0.18 +
      action.confidence * 0.14 +
      (1 - action.effort) * 0.10 -
      blockerPenalty;
    return Number(Math.max(0, Math.min(1, raw)).toFixed(4));
  }
}
