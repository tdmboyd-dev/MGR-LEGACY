import test from "node:test";
import assert from "node:assert/strict";
import { ConsentGuard } from "./index.js";

test("consent guard defaults to deny", () => {
  assert.equal(new ConsentGuard().canSend(null).allowed, false);
});

test("consent guard allows explicitly granted channel", () => {
  assert.equal(new ConsentGuard().canSend({
    tenantId: "t1",
    contactId: "c1",
    channel: "sms",
    status: "granted",
    source: "form",
    updatedAt: new Date().toISOString()
  }).allowed, true);
});
