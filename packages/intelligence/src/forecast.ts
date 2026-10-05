export interface ForecastInput {
  amount: number;
  stageProbability: number;
  engagementScore?: number;
  activityRecencyScore?: number;
  conversationCommitmentScore?: number;
  seasonalityFactor?: number;
}

export interface ForecastResult {
  expectedValue: number;
  probability: number;
  drivers: Record<string, number>;
}

export class ForecastBrain {
  forecast(input: ForecastInput): ForecastResult {
    const stage = clamp(input.stageProbability);
    const engagement = clamp(input.engagementScore ?? stage);
    const recency = clamp(input.activityRecencyScore ?? stage);
    const commitment = clamp(input.conversationCommitmentScore ?? stage);
    const seasonality = Math.max(0.5, Math.min(1.5, input.seasonalityFactor ?? 1));

    const probability = clamp(
      stage * 0.45 +
      engagement * 0.2 +
      recency * 0.15 +
      commitment * 0.2
    );

    return {
      expectedValue: Number((input.amount * probability * seasonality).toFixed(2)),
      probability: Number(probability.toFixed(4)),
      drivers: { stage, engagement, recency, commitment, seasonality }
    };
  }
}

function clamp(value:number):number {
  return Math.max(0, Math.min(1, value));
}
