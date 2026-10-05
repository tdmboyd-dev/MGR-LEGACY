import test from "node:test";
import assert from "node:assert/strict";
import { TodayOrchestrator } from "./today-orchestrator.js";

test("TODAY ranks urgent revenue leak above low-priority distant task", () => {
  const now=new Date("2026-10-05T05:00:00.000Z");
  const ranked=new TodayOrchestrator().build("u1",[
    {
      id:"t1",tenantId:"t1",ownerId:"u1",
      subject:{entityType:"task",entityId:"t1"},
      title:"Routine follow up",dueAt:"2026-10-10T05:00:00.000Z",priority:0.2
    }
  ],[
    {
      id:"l1",tenantId:"t1",ownerId:"u1",
      subject:{entityType:"opportunity",entityId:"o1"},
      title:"Recover stalled $10k opportunity",
      amountAtRisk:10000,recoveryProbability:0.8,urgency:0.95
    }
  ],now);
  assert.equal(ranked[0]!.id,"leak:l1");
});
