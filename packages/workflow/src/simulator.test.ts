import test from "node:test";
import assert from "node:assert/strict";
import type { WorkflowDefinition } from "@mgr/legacy-contracts";
import { WorkflowSimulator } from "./simulator.js";
import { AutomationConflictDetector } from "./conflicts.js";

const base: WorkflowDefinition = {
  workflowId: "w1",
  version: 1,
  name: "Lead follow up",
  status: "staged",
  trigger: { type: "event", config: { eventType: "contact.created" } },
  nodes: [
    { nodeId: "a", type: "send_message", config: { template: "welcome" } },
    { nodeId: "b", type: "create_task", config: { title: "Call lead" } }
  ],
  edges: [{ from: "a", to: "b" }]
};

test("simulator traverses workflow in dependency order", () => {
  const result = new WorkflowSimulator().simulate(base);
  assert.equal(result.valid, true);
  assert.deepEqual(result.steps.map((step) => step.nodeId), ["a", "b"]);
});

test("conflict detector catches duplicate action under same trigger", () => {
  const conflicts = new AutomationConflictDetector().detect([
    { ...base, status: "active" },
    { ...base, workflowId: "w2", status: "active" }
  ]);
  assert.ok(conflicts.some((item) => item.type === "duplicate_action"));
});
