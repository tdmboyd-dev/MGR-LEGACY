export interface Signal {
  id: string;
  tenantId: string;
  subjectType: string;
  subjectId: string;
  key: string;
  value: number | string | boolean;
  confidence: number;
  source: string;
  observedAt: string;
  expiresAt?: string;
  evidence?: Record<string, unknown>;
}

export class SignalGraph {
  private readonly signals = new Map<string, Signal>();

  upsert(signal: Signal): void {
    if (signal.confidence < 0 || signal.confidence > 1) throw new Error("Signal confidence must be 0..1");
    const key = `${signal.tenantId}:${signal.subjectType}:${signal.subjectId}:${signal.key}:${signal.source}`;
    this.signals.set(key, structuredClone(signal));
  }

  list(tenantId: string, subjectType: string, subjectId: string, now = new Date()): Signal[] {
    return structuredClone([...this.signals.values()].filter((signal) => {
      if (signal.tenantId !== tenantId || signal.subjectType !== subjectType || signal.subjectId !== subjectId) return false;
      if (signal.expiresAt && new Date(signal.expiresAt) <= now) return false;
      return true;
    }));
  }

  numericScore(tenantId: string, subjectType: string, subjectId: string, key: string): number | null {
    const relevant = this.list(tenantId, subjectType, subjectId).filter(
      (signal) => signal.key === key && typeof signal.value === "number"
    );
    if (!relevant.length) return null;
    const totalWeight = relevant.reduce((sum, signal) => sum + signal.confidence, 0);
    if (totalWeight === 0) return null;
    return relevant.reduce((sum, signal) => sum + Number(signal.value) * signal.confidence, 0) / totalWeight;
  }
}
