import test from "node:test";
import assert from "node:assert/strict";
import { WorkflowResumeWorker } from "./resume-worker.js";

test("resume worker processes due workflow", async()=>{
  const calls:string[]=[];
  const worker=new WorkflowResumeWorker(
    {listResumeCandidates:async()=>[
      {runId:"r1",workflowId:"w1",workflowVersion:1,nodeId:"n1"}
    ]},
    {get:async()=>({
      workflowId:"w1",
      version:1,
      name:"Demo",
      status:"active",
      trigger:{type:"manual",config:{}},
      nodes:[],
      edges:[]
    })},
    {load:async(runId)=>({
      tenantId:"t1",
      workflowId:"w1",
      workflowVersion:1,
      runId,
      correlationId:"c1",
      triggerPayload:{}
    })},
    {run:async(_workflow,context)=>{
      calls.push(context.runId);
      return {status:"succeeded",completedNodeIds:[],totalRetries:0};
    }} as any,
    {maxAttempts:3,initialDelayMs:1000,maxDelayMs:5000,backoffMultiplier:2}
  );

  const result=await worker.runOnce();
  assert.equal(result.scanned,1);
  assert.equal(result.resumed,1);
  assert.equal(result.failed,0);
  assert.deepEqual(calls,["r1"]);
});
