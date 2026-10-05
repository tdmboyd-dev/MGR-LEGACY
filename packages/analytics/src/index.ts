export type MetricAggregation = "sum" | "count" | "avg" | "min" | "max" | "ratio";

export interface MetricDefinition {
  key: string;
  label: string;
  description?: string;
  aggregation: MetricAggregation;
  numeratorKey?: string;
  denominatorKey?: string;
  unit?: "number" | "currency" | "percent" | "duration_ms";
}

export interface MetricPoint {
  metricKey: string;
  tenantId: string;
  scopeType: string;
  scopeId: string;
  value: number;
  observedAt: string;
  dimensions: Record<string, string>;
}

export interface MetricResult {
  metricKey: string;
  value: number;
  sampleSize: number;
}

export class SemanticMetricRegistry {
  private readonly definitions = new Map<string, MetricDefinition>();

  register(definition: MetricDefinition): void {
    if (this.definitions.has(definition.key)) throw new Error(`Metric already registered: ${definition.key}`);
    if (definition.aggregation === "ratio" && (!definition.numeratorKey || !definition.denominatorKey)) {
      throw new Error("Ratio metric requires numeratorKey and denominatorKey");
    }
    this.definitions.set(definition.key, structuredClone(definition));
  }

  get(key: string): MetricDefinition | null {
    return structuredClone(this.definitions.get(key) ?? null);
  }
}

export class MetricEngine {
  aggregate(definition: MetricDefinition, points: MetricPoint[]): MetricResult {
    const rows = points.filter((point) => point.metricKey === definition.key);
    if (!rows.length) return { metricKey: definition.key, value: 0, sampleSize: 0 };

    const values = rows.map((row) => row.value);
    let value = 0;
    switch (definition.aggregation) {
      case "sum": value = values.reduce((a, b) => a + b, 0); break;
      case "count": value = rows.length; break;
      case "avg": value = values.reduce((a, b) => a + b, 0) / rows.length; break;
      case "min": value = Math.min(...values); break;
      case "max": value = Math.max(...values); break;
      case "ratio":
        throw new Error("Use aggregateRatio for ratio metrics");
    }
    return { metricKey: definition.key, value, sampleSize: rows.length };
  }

  aggregateRatio(definition: MetricDefinition, points: MetricPoint[]): MetricResult {
    if (definition.aggregation !== "ratio" || !definition.numeratorKey || !definition.denominatorKey) {
      throw new Error("Invalid ratio definition");
    }
    const numerator = points.filter((point) => point.metricKey === definition.numeratorKey).reduce((sum, row) => sum + row.value, 0);
    const denominator = points.filter((point) => point.metricKey === definition.denominatorKey).reduce((sum, row) => sum + row.value, 0);
    return {
      metricKey: definition.key,
      value: denominator === 0 ? 0 : numerator / denominator,
      sampleSize: points.length
    };
  }
}

export interface AttributionTouch {
  contactId: string;
  opportunityId?: string;
  source: string;
  campaign?: string;
  occurredAt: string;
  weight?: number;
}

export class AttributionEngine {
  firstTouch(touches: AttributionTouch[]): AttributionTouch | null {
    return structuredClone([...touches].sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt))[0] ?? null);
  }

  lastTouch(touches: AttributionTouch[]): AttributionTouch | null {
    return structuredClone([...touches].sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt))[0] ?? null);
  }

  linear(touches: AttributionTouch[]): Array<AttributionTouch & { credit: number }> {
    if (!touches.length) return [];
    const credit = 1 / touches.length;
    return touches.map((touch) => ({ ...structuredClone(touch), credit }));
  }
}
