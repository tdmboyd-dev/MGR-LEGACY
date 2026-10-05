import test from "node:test";
import assert from "node:assert/strict";
import { ExtensionRegistry } from "./index.js";

test("extension registry rejects duplicate versions", () => {
  const registry = new ExtensionRegistry();
  const manifest = {
    id: "mgr-tax",
    version: "1.0.0",
    displayName: "Tax Pack",
    permissions: [],
    eventsConsumed: [],
    eventsEmitted: [],
    workflowNodes: [],
    capabilities: []
  };

  registry.register(manifest);
  assert.throws(() => registry.register(manifest), /already registered/);
});
