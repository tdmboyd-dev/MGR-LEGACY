import test from "node:test";
import assert from "node:assert/strict";
import type { WorkflowDefinition } from "@mgr/legacy-contracts";
import { DurableWorkflowRunner } from "./durable-runner.js";
import type { ExecutionCheckpoint } from "./durability.js";

test("durable runner checkpoints retryable failure and waits", async () => {
  const workflow:WorkflowDefinition={
    workflowId:"w1",
    version:1,
    name:"Retry demo",
    status:"active",
    trigger:{type:"manual",config:{}},
    nodes:[{nodeId:"n1",type:"unstable",config:{}}],
    edges:[]
  };

  const rows:ExecutionCheckpoint[]=[];
  const statuses:string[]=[];

  const runner=new DurableWorkflowRunner(
    [{
      supports:(type)=>type==="unstable",
      execute:async()=>{ throw new Error("timeout from provider"); }
    }],
    {
      upsert:async(checkpoint)=>{
        const index=rows.findIndex((row)=>row.nodeId===checkpoint.nodeId);
        if(index>=0) rows[index]=checkpoint;
        else rows.push(checkpoint);
      },
      listRun:async()=>rows
    },
    {
      updateStatus:async(_tenant,_id,status)=>{ statuses.push(status); }
    }
  );

  const result=await runner.run(
    workflow,
    {
      tenantId:"t1",
      workflowId:"w1",
      workflowVersion:1,
      runId:"r1",
      correlationId:"c1",
      triggerPayload:{}
    },
    {
      maxAttempts:3,
      initialDelayMs:1000,
      maxDelayMs:10000,
      backoffMultiplier:2,
      retryableErrors:["timeout"]
    }
  );

  assert.equal(result.status,"waiting");
  assert.equal(rows[0]!.status,"waiting");
  assert.ok(rows[0]!.nextAttemptAt);
  assert.deepEqual(statuses,["running","waiting"]);
});
