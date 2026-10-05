import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_TAX_AUTOMATION_POLICY, TaxSoftwareExecutionGuard, type TaxSoftwareAdapter, type TaxSoftwareTarget } from "./tax-software-adapters.js";

const target:TaxSoftwareTarget={
  software:"example-web-tax",
  surface:"browser",
  taxYear:2026,
  formType:"W-2",
  canonicalField:"w2.wages",
  locator:{strategy:"dom",value:"[data-field='wages']",expectedLabel:"Wages"}
};

test("tax software writes require reviewed facts and target verification",async()=>{
  let writes=0;
  const adapter:TaxSoftwareAdapter={
    id:"example",
    software:"example-web-tax",
    surface:"browser",
    supportedOperations:["write_field"],
    verifyTarget:async()=>({ok:true,observedLabel:"Wages"}),
    writeField:async(input)=>{
      writes+=1;
      return {target:input.target,observedAfter:input.value,executedAt:"2026-10-05T00:00:00.000Z"};
    }
  };
  const guard=new TaxSoftwareExecutionGuard(DEFAULT_TAX_AUTOMATION_POLICY);
  await assert.rejects(()=>guard.executeWrite({adapter,write:{factId:"f1",canonicalField:"w2.wages",value:50000,target},factReviewStatus:"unreviewed"}),/reviewed/);
  const result=await guard.executeWrite({adapter,write:{factId:"f1",canonicalField:"w2.wages",value:50000,target},factReviewStatus:"accepted"});
  assert.equal(writes,1);
  assert.equal(result.observedAfter,50000);
});

test("target label drift blocks writes",async()=>{
  const adapter:TaxSoftwareAdapter={
    id:"example",software:"example-web-tax",surface:"browser",supportedOperations:["write_field"],
    verifyTarget:async()=>({ok:true,observedLabel:"Different field"}),
    writeField:async()=>{throw new Error("should not write");}
  };
  const guard=new TaxSoftwareExecutionGuard(DEFAULT_TAX_AUTOMATION_POLICY);
  await assert.rejects(()=>guard.executeWrite({adapter,write:{factId:"f1",canonicalField:"w2.wages",value:1,target},factReviewStatus:"accepted"}),/label drift/);
});
