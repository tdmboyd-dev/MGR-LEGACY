import test from "node:test";
import assert from "node:assert/strict";
import { ProviderCircuitBreaker } from "./provider-health.js";

test("circuit opens after threshold and later allows half-open probe",()=>{
  const breaker=new ProviderCircuitBreaker(2,1000);
  const base={
    providerKey:"p1",
    channel:"sms" as const,
    priority:1,
    enabled:true,
    consecutiveFailures:0,
    circuitState:"closed" as const,
    updatedAt:"2026-10-05T06:00:00.000Z"
  };

  const one=breaker.onFailure(base,new Date("2026-10-05T06:00:00.000Z"));
  const two=breaker.onFailure(one,new Date("2026-10-05T06:00:01.000Z"));

  assert.equal(two.circuitState,"open");
  assert.equal(breaker.canAttempt(two,new Date("2026-10-05T06:00:01.500Z")),false);
  assert.equal(breaker.canAttempt(two,new Date("2026-10-05T06:00:02.500Z")),true);
});
