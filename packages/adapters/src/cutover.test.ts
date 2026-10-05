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
