import test from "node:test";
import assert from "node:assert/strict";
import { mapMgrAgentsContact, mapEliteHubLifecycle, reconcileIds } from "./index.js";

test("MGR Agents contact maps without losing legacy metadata", () => {
  const contact=mapMgrAgentsContact({
    id:"c1",
    userId:"u1",
    firstName:"Time",
    status:"lead",
    score:80,
    company:"MGR",
    jobTitle:"CEO",
    createdAt:"2026-01-01T00:00:00.000Z",
    updatedAt:"2026-01-02T00:00:00.000Z"
  },"t1");

  assert.equal(contact.tenantId,"t1");
  assert.equal(contact.customFields.legacyCompanyName,"MGR");
});

test("Elite Hub lifecycle stage maps into Tax Pack stage", () => {
  const mapped=mapEliteHubLifecycle({
    tenantId:"t1",
    clientId:"c1",
    taxYear:2026,
    stage:"Ready for Signature",
    updatedAt:"2026-01-01T00:00:00.000Z"
  });

  assert.equal(mapped.stage,"ready_for_signature");
});

test("reconciliation reports missing destination ids", () => {
  const result=reconcileIds(["1","2","3"],["1","3"]);
  assert.deepEqual(result.missingInDestination,["2"]);
});
