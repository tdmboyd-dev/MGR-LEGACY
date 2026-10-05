import test from "node:test";
import assert from "node:assert/strict";
import { FlowSpecValidator, type FlowSpec } from "./flowspec.js";

test("critical flows cannot be autonomous",()=>{
  const spec:FlowSpec={
    specVersion:"1.0",
    purpose:"Test",
    owner:"ops",
    riskTier:"critical",
    executionMode:"autonomous",
    invariants:["never bypass approval"],
    successCriteria:["completed"],
    evidenceRequirements:["receipt"],
    workflow:{
      workflowId:"w1",version:1,name:"Test",status:"staged",
      trigger:{type:"manual",config:{}},nodes:[],edges:[]
    }
  };
  assert.ok(new FlowSpecValidator().validate(spec).includes("Critical workflows cannot run autonomously"));
});
