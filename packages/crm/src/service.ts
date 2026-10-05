import { randomUUID } from "node:crypto";
import type { Contact, Opportunity, Pipeline, PipelineStage, Task } from "./types.js";
import type { CrmRepositories } from "./repository.js";

export class CrmService {
  constructor(private readonly repos: CrmRepositories) {}

  async createContact(input: Omit<Contact, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Contact> {
    const now = new Date().toISOString();
    return this.repos.contacts.create({
      ...input,
      id: input.id ?? randomUUID(),
      createdAt: now,
      updatedAt: now
    });
  }

  async createPipeline(input: Omit<Pipeline, "id"> & { id?: string; stages?: Array<Omit<PipelineStage, "id" | "pipelineId" | "tenantId"> & { id?: string }> }): Promise<{ pipeline: Pipeline; stages: PipelineStage[] }> {
    const pipeline = await this.repos.pipelines.create({
      id: input.id ?? randomUUID(),
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      default: input.default
    });
    const stages: PipelineStage[] = [];
    for (const stage of input.stages ?? []) {
      stages.push(await this.repos.stages.create({
        ...stage,
        id: stage.id ?? randomUUID(),
        tenantId: input.tenantId,
        pipelineId: pipeline.id
      }));
    }
    return { pipeline, stages };
  }

  async createOpportunity(input: Omit<Opportunity, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Opportunity> {
    const pipeline = await this.repos.pipelines.get(input.tenantId, input.pipelineId);
    const stage = await this.repos.stages.get(input.tenantId, input.stageId);
    if (!pipeline) throw new Error("Unknown pipeline");
    if (!stage || stage.pipelineId !== pipeline.id) throw new Error("Stage does not belong to pipeline");
    const now = new Date().toISOString();
    return this.repos.opportunities.create({
      ...input,
      id: input.id ?? randomUUID(),
      createdAt: now,
      updatedAt: now
    });
  }

  async moveOpportunity(tenantId: string, opportunityId: string, stageId: string): Promise<Opportunity> {
    const opportunity = await this.repos.opportunities.get(tenantId, opportunityId);
    if (!opportunity) throw new Error("Opportunity not found");
    const stage = await this.repos.stages.get(tenantId, stageId);
    if (!stage || stage.pipelineId !== opportunity.pipelineId) throw new Error("Invalid pipeline stage");
    return this.repos.opportunities.update(tenantId, opportunityId, {
      stageId,
      probability: stage.probability ?? opportunity.probability,
      updatedAt: new Date().toISOString()
    });
  }

  async createTask(input: Omit<Task, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Task> {
    const now = new Date().toISOString();
    return this.repos.tasks.create({
      ...input,
      id: input.id ?? randomUUID(),
      createdAt: now,
      updatedAt: now
    });
  }
}
