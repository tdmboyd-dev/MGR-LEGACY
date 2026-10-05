import type { WorkflowDefinition } from "@mgr/legacy-contracts";

export interface WorkflowExecutionContext {
  tenantId: string;
  workflowId: string;
  workflowVersion: number;
  runId: string;
  correlationId: string;
  triggerPayload: Record<string, unknown>;
}

export interface NodeExecutionResult {
  nodeId: string;
  status: "succeeded" | "failed" | "skipped" | "waiting";
  output?: Record<string, unknown>;
  error?: string;
}

export interface WorkflowActionExecutor {
  supports(nodeType: string): boolean;
  execute(nodeType: string, config: Record<string, unknown>, context: WorkflowExecutionContext): Promise<Record<string, unknown>>;
}

export class WorkflowRuntime {
  constructor(private readonly executors: WorkflowActionExecutor[]) {}

  private executorFor(type: string): WorkflowActionExecutor {
    const executor = this.executors.find((candidate) => candidate.supports(type));
    if (!executor) throw new Error(`No executor registered for node type: ${type}`);
    return executor;
  }

  async run(workflow: WorkflowDefinition, context: WorkflowExecutionContext): Promise<NodeExecutionResult[]> {
    const inbound = new Map<string, number>();
    const outgoing = new Map<string, string[]>();
    for (const edge of workflow.edges) {
      inbound.set(edge.to, (inbound.get(edge.to) ?? 0) + 1);
      outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge.to]);
    }

    const nodes = new Map(workflow.nodes.map((node) => [node.nodeId, node]));
    const queue = workflow.nodes.filter((node) => !inbound.has(node.nodeId)).map((node) => node.nodeId);
    const completed = new Set<string>();
    const results: NodeExecutionResult[] = [];
    let guard = 0;

    while (queue.length) {
      if (guard++ > workflow.nodes.length * 10 + 100) throw new Error("Workflow execution guard exceeded");
      const nodeId = queue.shift()!;
      if (completed.has(nodeId)) continue;
      const node = nodes.get(nodeId);
      if (!node) continue;

      try {
        const output = await this.executorFor(node.type).execute(node.type, node.config, context);
        results.push({ nodeId, status: "succeeded", output });
      } catch (error) {
        results.push({ nodeId, status: "failed", error: error instanceof Error ? error.message : String(error) });
        break;
      }

      completed.add(nodeId);
      for (const next of outgoing.get(nodeId) ?? []) {
        const parents = workflow.edges.filter((edge) => edge.to === next).map((edge) => edge.from);
        if (parents.every((parent) => completed.has(parent))) queue.push(next);
      }
    }

    return results;
  }
}
