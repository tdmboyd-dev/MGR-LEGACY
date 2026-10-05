import test from "node:test";
import assert from "node:assert/strict";
import { FilingApprovalGate, TaxFactGraph } from "./tax-facts.js";

const base={
  tenantId:"t1",
  clientEntityId:"c1",
  taxYear:2026,
  formType:"W-2",
  source:{documentId:"d1",page:1},
  extraction:{provider:"test",observedAt:"2026-10-05T00:00:00.000Z"}
};

test("low-confidence and mandatory tax facts are routed to human review",()=>{
  const graph=new TaxFactGraph({autoAcceptThreshold:0.99,mandatoryReviewFields:["taxpayer.ssn"]});
  const result=graph.ingest([
    {id:"f1",...base,canonicalField:"w2.wages",value:50000,confidence:0.999},
    {id:"f2",...base,canonicalField:"taxpayer.ssn",value:"***",confidence:1},
    {id:"f3",...base,canonicalField:"w2.withholding",value:5000,confidence:0.7}
  ]);
  assert.deepEqual(result.accepted.map(f=>f.id),["f1"]);
  assert.deepEqual(result.reviewQueue.map(f=>f.id),["f2","f3"]);
  assert.throws(()=>graph.assertReadyForPreparation("t1","c1",2026),/require review/);
});

test("review preserves correction lineage and unlocks preparation",()=>{
  const graph=new TaxFactGraph({autoAcceptThreshold:0.99,mandatoryReviewFields:[]});
  graph.ingest([{id:"f1",...base,canonicalField:"w2.wages",value:5000,confidence:0.5}]);
  const reviewed=graph.review({factId:"f1",reviewerId:"p1",decision:"correct",correctedValue:50000,at:"2026-10-05T01:00:00.000Z"});
  assert.equal(reviewed.originalValue,5000);
  assert.equal(reviewed.value,50000);
  assert.equal(reviewed.reviewStatus,"corrected");
  graph.assertReadyForPreparation("t1","c1",2026);
});

test("filing is blocked until an explicit preparer approval exists",()=>{
  const gate=new FilingApprovalGate();
  assert.throws(()=>gate.assertApproved("r1"),/Explicit preparer approval/);
  gate.approve({returnId:"r1",preparerId:"p1",approvedAt:"2026-10-05T01:00:00.000Z",evidenceReceiptId:"receipt-1"});
  assert.equal(gate.assertApproved("r1").preparerId,"p1");
});
