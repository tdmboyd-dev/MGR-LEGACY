import test from "node:test";
import assert from "node:assert/strict";
import { createInMemoryCrmRepositories } from "./repository.js";
import { CrmService } from "./service.js";

test("opportunity cannot move into another pipeline's stage", async () => {
  const repos = createInMemoryCrmRepositories();
  const crm = new CrmService(repos);

  const a = await crm.createPipeline({
    tenantId: "t1",
    name: "Sales",
    default: true,
    stages: [{ name: "New", order: 1, probability: 10 }]
  });
  const b = await crm.createPipeline({
    tenantId: "t1",
    name: "Renewal",
    default: false,
    stages: [{ name: "Due", order: 1, probability: 50 }]
  });

  const opportunity = await crm.createOpportunity({
    tenantId: "t1",
    ownerId: "u1",
    pipelineId: a.pipeline.id,
    stageId: a.stages[0]!.id,
    title: "Example",
    value: 1000,
    currency: "USD",
    status: "open",
    probability: 10,
    customFields: {}
  });

  await assert.rejects(() => crm.moveOpportunity("t1", opportunity.id, b.stages[0]!.id), /Invalid pipeline stage/);
});
