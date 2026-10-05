import test from "node:test";
import assert from "node:assert/strict";
import {
  ProviderIncidentTodaySource,
  WaitingWorkflowTodaySource
} from "./operational-today.js";

test("waiting workflow source marks overdue retry urgent", async()=>{
  const source=new WaitingWorkflowTodaySource(async()=>[{
    runId:"r1",
    tenantId:"t1",
    ownerId:"u1",
    workflowName:"Lead Follow Up",
    subject:{entityType:"custom",entityId:"w1"},
    retryAt:"2026-10-05T05:00:00.000Z",
    lastError:"timeout",
    retries:2
  }]);

  const rows=await source.collect("u1",new Date("2026-10-05T06:00:00.000Z"));
  assert.equal(rows[0]!.urgency,0.95);
});

test("open provider circuit becomes top priority incident", async()=>{
  const source=new ProviderIncidentTodaySource(async()=>[{
    id:"p1",
    tenantId:"t1",
    ownerId:"u1",
    providerKey:"sms-primary",
    channel:"sms",
    subject:{entityType:"custom",entityId:"provider:sms-primary"},
    consecutiveFailures:4,
    circuitOpen:true
  }]);

  const rows=await source.collect("u1");
  assert.equal(rows[0]!.urgency,1);
  assert.equal(rows[0]!.risk,1);
});
