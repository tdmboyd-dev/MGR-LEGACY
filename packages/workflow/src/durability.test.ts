import test from "node:test";
import assert from "node:assert/strict";
import { RetryPlanner, CheckpointLedger } from "./durability.js";

test("retry planner uses capped exponential backoff",()=>{
  const planner=new RetryPlanner();
  const result=planner.nextAttempt(3,{
    maxAttempts:5,
    initialDelayMs:1000,
    maxDelayMs:2500,
    backoffMultiplier:2
  },new Date("2026-10-05T06:00:00.000Z"));

  assert.equal(result.retry,true);
  assert.equal(result.delayMs,2500);
});

test("checkpoint ledger returns due resume candidates",()=>{
  const ledger=new CheckpointLedger();
  ledger.save({
    runId:"r1",workflowId:"w1",workflowVersion:1,nodeId:"n1",attempt:1,
    status:"waiting",nextAttemptAt:"2026-10-05T06:00:00.000Z",
    updatedAt:"2026-10-05T05:00:00.000Z"
  });
  ledger.save({
    runId:"r1",workflowId:"w1",workflowVersion:1,nodeId:"n2",attempt:1,
    status:"waiting",nextAttemptAt:"2026-10-05T08:00:00.000Z",
    updatedAt:"2026-10-05T05:00:00.000Z"
  });

  const due=ledger.resumeCandidates("r1",new Date("2026-10-05T06:30:00.000Z"));
  assert.deepEqual(due.map(row=>row.nodeId),["n1"]);
});
