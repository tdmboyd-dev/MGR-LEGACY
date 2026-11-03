import test from "node:test";
import assert from "node:assert/strict";
import { CutoverGate } from "./cutover.js";

test("cutover gate blocks imperfect reconciliation", () => {
  const result=new CutoverGate().evaluate({
    reconciledPercent:99.9,
    mismatchCount:1,
    duplicateCount:0,
    errorRate:0,
    rollbackReady:true,
    auditComplete:true
  });
  assert.equal(result.ready,false);
  assert.ok(result.blockers.length>=2);
});

test("cutover rejects nonfinite, impossible and missing parity evidence",()=>{
 const valid={reconciledPercent:100,mismatchCount:0,duplicateCount:0,errorRate:0,rollbackReady:true,auditComplete:true};
 for(const patch of [{reconciledPercent:NaN},{reconciledPercent:101},{mismatchCount:-1},{duplicateCount:NaN},{errorRate:NaN},{errorRate:-1}])assert.equal(new CutoverGate().evaluate({...valid,...patch}).ready,false);
 assert.equal(new CutoverGate().evaluate(valid).ready,true);
});
