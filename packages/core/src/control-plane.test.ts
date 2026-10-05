import test from "node:test";
import assert from "node:assert/strict";
import { ShadowAutopilot } from "./shadow-autopilot.js";
import { TruthConsoleProjector } from "./truth-console.js";
import type { ActionReceipt } from "./action-receipts.js";

test("shadow autopilot graduates only with strong evidence",()=>{
  const result=new ShadowAutopilot().evaluate("ask",{
    successfulRuns:100,failedRuns:0,blockedRuns:0,
    approvalOverrideRate:0,rollbackRate:0,criticalIncidents:0,evidenceCoverage:1
  });
  assert.equal(result.eligible,true);
  assert.equal(result.recommended,"limited");
});

test("truth console summarizes action receipts",()=>{
  const receipt:ActionReceipt={
    receiptId:"r1",tenantId:"t1",correlationId:"c1",
    actor:{actorType:"agent",actorId:"a1",tenantId:"t1"},
    scope:{tenantId:"t1",scopeType:"organization",scopeId:"o1"},
    action:"crm.update_contact",executionMode:"ask",status:"succeeded",
    argumentSummary:{field:"phone"},policyDecision:"allow",
    approvals:[{approvalId:"p1",approverId:"u1",decision:"approved",decidedAt:"2026-10-05T00:00:00.000Z"}],
    evidence:{before:true,after:true},startedAt:"2026-10-05T00:00:00.000Z",
    completedAt:"2026-10-05T00:00:01.000Z",reversible:true,
    provider:{providerKey:"crm",cost:0.02}
  };
  const summary=new TruthConsoleProjector().summary([receipt]);
  assert.equal(summary.succeeded,1);
  assert.equal(summary.approvalRate,1);
  assert.equal(summary.totalProviderCost,0.02);
});
