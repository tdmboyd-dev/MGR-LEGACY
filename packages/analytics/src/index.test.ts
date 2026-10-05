import test from "node:test";
import assert from "node:assert/strict";
import { AttributionEngine, MetricEngine } from "./index.js";

test("metric engine aggregates sums", () => {
  const result = new MetricEngine().aggregate(
    { key:"revenue", label:"Revenue", aggregation:"sum", unit:"currency" },
    [
      { metricKey:"revenue", tenantId:"t1", scopeType:"office", scopeId:"o1", value:100, observedAt:new Date().toISOString(), dimensions:{} },
      { metricKey:"revenue", tenantId:"t1", scopeType:"office", scopeId:"o1", value:250, observedAt:new Date().toISOString(), dimensions:{} }
    ]
  );
  assert.equal(result.value, 350);
});

test("linear attribution splits credit equally", () => {
  const result = new AttributionEngine().linear([
    { contactId:"c1", source:"google", occurredAt:"2026-01-01T00:00:00.000Z" },
    { contactId:"c1", source:"referral", occurredAt:"2026-01-02T00:00:00.000Z" }
  ]);
  assert.equal(result[0]!.credit, 0.5);
  assert.equal(result[1]!.credit, 0.5);
});
