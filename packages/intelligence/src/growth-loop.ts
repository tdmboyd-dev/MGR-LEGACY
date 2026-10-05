export type GrowthOpportunityType = "referral" | "reactivation" | "upsell" | "cross_sell" | "review_request";

export interface CustomerGrowthSignals {
  customerId: string;
  active: boolean;
  daysSinceLastPurchase: number;
  lifetimeValue: number;
  satisfactionScore?: number;
  referralCount: number;
  productCount: number;
  engagementScore: number;
}

export interface GrowthOpportunity {
  customerId: string;
  type: GrowthOpportunityType;
  score: number;
  reason: string;
}

export class GrowthLoop {
  find(signals: CustomerGrowthSignals): GrowthOpportunity[] {
    const opportunities: GrowthOpportunity[] = [];
    const satisfaction = signals.satisfactionScore ?? 0.5;

    if (signals.active && satisfaction >= 0.8 && signals.referralCount === 0) {
      opportunities.push({
        customerId: signals.customerId,
        type: "referral",
        score: Number((satisfaction * 0.7 + signals.engagementScore * 0.3).toFixed(4)),
        reason: "High satisfaction and engagement with no referrals yet"
      });
    }

    if (!signals.active && signals.daysSinceLastPurchase > 90) {
      opportunities.push({
        customerId: signals.customerId,
        type: "reactivation",
        score: Number(Math.min(1, 0.45 + Math.min(signals.lifetimeValue / 10000, 0.35) + signals.engagementScore * 0.2).toFixed(4)),
        reason: "Inactive customer with prior value"
      });
    }

    if (signals.active && signals.productCount === 1 && signals.lifetimeValue > 1000) {
      opportunities.push({
        customerId: signals.customerId,
        type: "cross_sell",
        score: Number(Math.min(1, 0.5 + signals.engagementScore * 0.3 + satisfaction * 0.2).toFixed(4)),
        reason: "Established customer using only one product/service"
      });
    }

    if (signals.active && satisfaction >= 0.85) {
      opportunities.push({
        customerId: signals.customerId,
        type: "review_request",
        score: Number((satisfaction * 0.8 + signals.engagementScore * 0.2).toFixed(4)),
        reason: "Strong satisfaction signal"
      });
    }

    return opportunities.sort((a,b)=>b.score-a.score);
  }
}
