import test from "node:test";
import assert from "node:assert/strict";
import { DealCoach } from "./deal-coach.js";
import { ServiceBrain } from "./service-brain.js";
import { GrowthLoop } from "./growth-loop.js";

test("deal coach identifies stale single-threaded risk", () => {
  const result = new DealCoach().analyze({
    amount: 12000,
    daysSinceActivity: 20,
    stakeholderCount: 1,
    hasDecisionMaker: false,
    nextStepScheduled: false,
    objectionCount: 2,
    stageProbability: 0.8
  });
  assert.ok(result.riskScore > 0.5);
  assert.ok(result.recommendedActions.length >= 3);
});

test("service brain escalates high SLA risk", () => {
  const result = new ServiceBrain().triage({
    ageHours: 23,
    slaHours: 24,
    priority: 1,
    reopenCount: 2,
    customerHealth: 0.2,
    unresolvedDependencies: 2
  });
  assert.equal(result.breachRisk, "high");
});

test("growth loop finds referral and review opportunities", () => {
  const result = new GrowthLoop().find({
    customerId: "c1",
    active: true,
    daysSinceLastPurchase: 10,
    lifetimeValue: 4000,
    satisfactionScore: 0.95,
    referralCount: 0,
    productCount: 1,
    engagementScore: 0.9
  });
  assert.ok(result.some((item)=>item.type==="referral"));
  assert.ok(result.some((item)=>item.type==="review_request"));
});
