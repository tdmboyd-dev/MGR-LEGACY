import test from "node:test";
import assert from "node:assert/strict";
import { DealRoomEngine } from "./deal-room.js";

test("deal room detects stale unsigned risky opportunity", () => {
  const result=new DealRoomEngine().assess({
    opportunityId:"o1",
    tenantId:"t1",
    value:10000,
    probability:0.8,
    stakeholders:[{contactId:"c1",role:"champion",influence:0.5,decisionMaker:false}],
    objections:[{id:"x",category:"price",text:"too high",status:"open",severity:1}],
    nextSteps:[],
    lastActivityAt:"2026-09-01T00:00:00.000Z",
    proposalStatus:"viewed"
  },new Date("2026-10-05T00:00:00.000Z"));

  assert.ok(result.score<0.5);
  assert.ok(result.recommendedActions.length>=3);
});
