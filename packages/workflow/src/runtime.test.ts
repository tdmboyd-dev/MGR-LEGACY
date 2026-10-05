import test from "node:test";
import assert from "node:assert/strict";
import type { WorkflowDefinition } from "@mgr/legacy-contracts";
import { WorkflowRuntime } from "./runtime.js";
import { AutomationSelfAudit } from "./health.js";

test("runtime executes dependency chain once", async () => {
  const workflow: WorkflowDefinition = {
    workflowId: "w1",
    version: 1,
    name: "Demo",
    status: "active",
    trigger: { type: "manual", config: {} },
    nodes: [
      { nodeId: "a", type: "noop", config: {} },
      { nodeId: "b", type: "noop", config: {} }
    ],
    edges: [{ from: "a", to: "b" }]
  };

  const runtime = new WorkflowRuntime([{
    supports: (type) => type === "noop",
    execute: async () => ({ ok: true })
  }]);

  const result = await runtime.run(workflow, {
    tenantId: "t1",
    workflowId: "w1",
    workflowVersion: 1,
    runId: "r1",
    correlationId: "c1",
    triggerPayload: {}
  });

  assert.deepEqual(result.map((row) => row.nodeId), ["a", "b"]);
  assert.ok(result.every((row) => row.status === "succeeded"));
});

test("self audit flags unhealthy workflows", () => {
  const health = new AutomationSelfAudit().evaluate([
    { workflowId: "w1", succeeded: true, durationMs: 100, retries: 0, cost: 0.01, providerErrors: 0 },
    { workflowId: "w1", succeeded: false, durationMs: 400, retries: 2, cost: 0.04, providerErrors: 1 }
  ])[0]!;

  assert.ok(health.score < 0.95);
  assert.ok(health.warnings.length > 0);
});
