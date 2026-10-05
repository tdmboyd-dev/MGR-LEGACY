import type { WorkflowDefinition } from "@mgr/legacy-contracts";
import type { ExecutionCheckpoint, RetryPolicy } from "./durability.js";
import { RetryPlanner } from "./durability.js";
import type { WorkflowActionExecutor, WorkflowExecutionContext } from "./runtime.js";

export interface CheckpointStore {
  upsert(checkpoint: ExecutionCheckpoint): Promise<void>;
  listRun(runId: string): Promise<ExecutionCheckpoint[]>;
}

export interface WorkflowRunStore {
  updateStatus(
    tenantId: string,
    id: string,
    status: "queued" | "running" | "waiting" | "succeeded" | "failed" | "cancelled",
    patch?: { completedAt?: string; lastError?: string; retries?: number; cost?: number }
  ): Promise<void>;
}

export interface DurableRunResult {
  status: "succeeded" | "waiting" | "failed";
  completedNodeIds: string[];
  failedNodeId?: string;
  waitingNodeId?: string;
  totalRetries: number;
}

export class DurableWorkflowRunner {
  private readonly retryPlanner = new RetryPlanner();

  constructor(
    private readonly executors: WorkflowActionExecutor[],
    private readonly checkpoints: CheckpointStore,
    private readonly runs: WorkflowRunStore
  ) {}

  private executor(type: string): WorkflowActionExecutor {
    const executor = this.executors.find((item) => item.supports(type));
    if (!executor) throw new Error(`No executor registered for node type: ${type}`);
    return executor;
  }

  async run(
    workflow: WorkflowDefinition,
    context: WorkflowExecutionContext,
    policy: RetryPolicy
  ): Promise<DurableRunResult> {
    await this.runs.updateStatus(context.tenantId, context.runId, "running");

    const existing = await this.checkpoints.listRun(context.runId);
    const completed = new Set(
      existing.filter((row) => row.status === "succeeded").map((row) => row.nodeId)
    );
    let totalRetries = existing.reduce((sum, row) => sum + Math.max(0, row.attempt - 1), 0);

    const inbound = new Map<string, string[]>();
    const outgoing = new Map<string, string[]>();

    for (const edge of workflow.edges) {
      inbound.set(edge.to, [...(inbound.get(edge.to) ?? []), edge.from]);
      outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge.to]);
    }

    const byId = new Map(workflow.nodes.map((node) => [node.nodeId, node]));
    const queue = workflow.nodes
      .filter((node) =>
        (inbound.get(node.nodeId) ?? []).every((parent) => completed.has(parent)) &&
        !completed.has(node.nodeId)
      )
      .map((node) => node.nodeId);

    const queued = new Set(queue);
    const nowIso = () => new Date().toISOString();

    while (queue.length) {
      const nodeId = queue.shift()!;
      queued.delete(nodeId);

      const node = byId.get(nodeId);
      if (!node || completed.has(nodeId)) continue;

      const prior = existing.find((row) => row.nodeId === nodeId);
      const attempt = (prior?.attempt ?? 0) + 1;

      await this.checkpoints.upsert({
        runId: context.runId,
        workflowId: workflow.workflowId,
        workflowVersion: workflow.version,
        nodeId,
        attempt,
        status: "running",
        input: context.triggerPayload,
        updatedAt: nowIso()
      });

      try {
        const output = await this.executor(node.type).execute(node.type, node.config, context);

        await this.checkpoints.upsert({
          runId: context.runId,
          workflowId: workflow.workflowId,
          workflowVersion: workflow.version,
          nodeId,
          attempt,
          status: "succeeded",
          input: context.triggerPayload,
          output,
          updatedAt: nowIso()
        });

        completed.add(nodeId);

        for (const next of outgoing.get(nodeId) ?? []) {
          const parents = inbound.get(next) ?? [];
          if (
            parents.every((parent) => completed.has(parent)) &&
            !completed.has(next) &&
            !queued.has(next)
          ) {
            queue.push(next);
            queued.add(next);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const retryable = this.retryPlanner.isRetryable(message, policy);
        const plan = retryable
          ? this.retryPlanner.nextAttempt(attempt, policy)
          : { retry: false, delayMs: 0 };

        if (plan.retry) {
          totalRetries += 1;

          await this.checkpoints.upsert({
            runId: context.runId,
            workflowId: workflow.workflowId,
            workflowVersion: workflow.version,
            nodeId,
            attempt,
            status: "waiting",
            input: context.triggerPayload,
            error: message,
            nextAttemptAt: plan.nextAttemptAt,
            updatedAt: nowIso()
          });

          await this.runs.updateStatus(context.tenantId, context.runId, "waiting", {
            lastError: message,
            retries: totalRetries
          });

          return {
            status: "waiting",
            completedNodeIds: [...completed],
            waitingNodeId: nodeId,
            totalRetries
          };
        }

        await this.checkpoints.upsert({
          runId: context.runId,
          workflowId: workflow.workflowId,
          workflowVersion: workflow.version,
          nodeId,
          attempt,
          status: "failed",
          input: context.triggerPayload,
          error: message,
          updatedAt: nowIso()
        });

        await this.runs.updateStatus(context.tenantId, context.runId, "failed", {
          completedAt: nowIso(),
          lastError: message,
          retries: totalRetries
        });

        return {
          status: "failed",
          completedNodeIds: [...completed],
          failedNodeId: nodeId,
          totalRetries
        };
      }
    }

    await this.runs.updateStatus(context.tenantId, context.runId, "succeeded", {
      completedAt: nowIso(),
      retries: totalRetries
    });

    return {
      status: "succeeded",
      completedNodeIds: [...completed],
      totalRetries
    };
  }
}
