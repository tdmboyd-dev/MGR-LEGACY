import test from "node:test";
import assert from "node:assert/strict";
import { HierarchyHealthEngine } from "./index.js";

test("office is not activation-ready with unresolved compliance issues", () => {
  const result = new HierarchyHealthEngine().evaluate({
    credentialsReady: true,
    bankProductsConfigured: true,
    usersInvited: true,
    workflowsEnabled: true,
    trainingComplete: true,
    consentTemplatesReady: true,
    unresolvedComplianceIssues: 1
  });

  assert.equal(result.activationReady, false);
  assert.ok(result.blockers.includes("Resolve compliance issues"));
});
