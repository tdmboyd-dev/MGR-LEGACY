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

test("consent quiet hours honor the recipient time zone and invalid settings deny",()=>{
 const base={tenantId:"t",contactId:"c",channel:"sms" as const,status:"granted" as const,source:"form",updatedAt:"2026-01-01T00:00:00Z",quietHours:{start:"22:00",end:"08:00",timezone:"America/Chicago"}};
 assert.equal(new ConsentGuard().canSend(base,new Date("2026-01-01T05:00:00Z")).allowed,false);
 assert.equal(new ConsentGuard().canSend(base,new Date("2026-01-01T18:00:00Z")).allowed,true);
 assert.equal(new ConsentGuard().canSend({...base,quietHours:{...base.quietHours,timezone:"invalid"}}).allowed,false);
});
