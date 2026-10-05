import test from "node:test";
import assert from "node:assert/strict";
import { RevenueLeakScanner } from "./revenue-leak.js";
import { SignalGraph } from "./signal-graph.js";

test("revenue leak scanner ranks recoverable urgent revenue first", () => {
  const ranked = new RevenueLeakScanner().rank([
    {
      id: "a", tenantId: "t1", subjectType: "opportunity", subjectId: "o1",
      type: "stalled_opportunity", amountAtRisk: 1000, probabilityRecoverable: 0.8, urgency: 0.9, evidence: {}
    },
    {
      id: "b", tenantId: "t1", subjectType: "opportunity", subjectId: "o2",
      type: "stalled_opportunity", amountAtRisk: 400, probabilityRecoverable: 0.8, urgency: 0.9, evidence: {}
    }
  ]);
  assert.equal(ranked[0]!.id, "a");
});

test("signal graph computes confidence weighted numeric score", () => {
  const graph = new SignalGraph();
  graph.upsert({
    id: "s1", tenantId: "t1", subjectType: "contact", subjectId: "c1", key: "intent",
    value: 0.9, confidence: 1, source: "web", observedAt: new Date().toISOString()
  });
  graph.upsert({
    id: "s2", tenantId: "t1", subjectType: "contact", subjectId: "c1", key: "intent",
    value: 0.3, confidence: 0.5, source: "email", observedAt: new Date().toISOString()
  });
  assert.equal(Number(graph.numericScore("t1", "contact", "c1", "intent")!.toFixed(2)), 0.7);
});
