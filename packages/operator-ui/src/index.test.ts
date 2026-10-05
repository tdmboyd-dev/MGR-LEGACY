import test from "node:test";
import assert from "node:assert/strict";
import { OperatorUiProjector } from "./index.js";

test("operator dashboard projects action KPIs",()=>{
  const model=new OperatorUiProjector().dashboard({
    tenantId:"t1",
    truthRows:[],
    receipts:[{
      receiptId:"r1",tenantId:"t1",correlationId:"c1",
      actor:{actorType:"agent",actorId:"a1",tenantId:"t1"},
      scope:{tenantId:"t1",scopeType:"organization",scopeId:"o1"},
      action:"x",executionMode:"ask",status:"succeeded",argumentSummary:{},
      policyDecision:"allow",approvals:[],evidence:{},startedAt:"2026-10-05T00:00:00.000Z",
      reversible:false,provider:{cost:0.25}
    }],
    events:[]
  });
  assert.equal(model.kpis.find(k=>k.key==="actions.success")?.value,1);
  assert.equal(model.kpis.find(k=>k.key==="provider.cost")?.value,0.25);
});
