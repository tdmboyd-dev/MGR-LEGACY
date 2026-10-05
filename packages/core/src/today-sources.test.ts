import test from "node:test";
import assert from "node:assert/strict";
import {
  TodayFeed,
  ConversationTodaySource,
  WorkflowTodaySource,
  ComplianceTodaySource
} from "./today-sources.js";

test("TODAY combines conversations, automations, and compliance into one ranked feed", async()=>{
  const feed=new TodayFeed([
    new ConversationTodaySource(async()=>[{
      id:"c1",tenantId:"t1",ownerId:"u1",
      subject:{entityType:"person",entityId:"p1"},
      title:"Reply to customer",reason:"Unanswered inbound",
      priority:0.9,confidence:1
    }]),
    new WorkflowTodaySource(async()=>[{
      id:"w1",tenantId:"t1",ownerId:"u1",
      subject:{entityType:"custom",entityId:"workflow-1"},
      workflowName:"Lead Follow Up",healthScore:0.6,failureRate:0.2
    }]),
    new ComplianceTodaySource(async()=>[{
      id:"x1",tenantId:"t1",ownerId:"u1",
      subject:{entityType:"custom",entityId:"office-1"},
      title:"Resolve compliance item",severity:1,
      dueAt:"2026-10-05T05:00:00.000Z",reason:"Credential expired"
    }])
  ]);

  const result=await feed.build("u1",new Date("2026-10-05T06:00:00.000Z"));
  assert.equal(result.length,3);
  assert.ok(result[0]!.rankScore>=result[1]!.rankScore);
  assert.ok(result.some(item=>item.id==="conversation:c1"));
  assert.ok(result.some(item=>item.id==="workflow:w1"));
  assert.ok(result.some(item=>item.id==="compliance:x1"));
});
