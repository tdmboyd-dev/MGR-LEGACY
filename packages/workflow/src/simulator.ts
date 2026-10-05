import type { WorkflowDefinition } from "@mgr/legacy-contracts";
import { validateWorkflow } from "./graph.js";

export interface SimulationStep {
  nodeId: string;
  nodeType: string;
  status: "would_run" | "skipped";
  reason?: string;
}

export interface SimulationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  steps: SimulationStep[];
  possibleLoop: boolean;
}

export class WorkflowSimulator {
  simulate(workflow: WorkflowDefinition): SimulationResult {
    const validation = validateWorkflow(workflow);
    if (!validation.valid) return { ...validation, steps: [], possibleLoop: false };

    const adjacency = new Map<string, string[]>();
    for (const edge of workflow.edges) {
      adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
    }

    const inbound = new Set(workflow.edges.map((edge) => edge.to));
    const roots = workflow.nodes.filter((node) => !inbound.has(node.nodeId));
    const byId = new Map(workflow.nodes.map((node) => [node.nodeId, node]));
    const steps: SimulationStep[] = [];
    const queue = roots.map((node) => ({ id: node.nodeId, path: new Set<string>() }));
    let possibleLoop = false;
    let guard = 0;

    while (queue.length && guard++ < 10000) {
      const current = queue.shift()!;
      const node = byId.get(current.id);
      if (!node) continue;
      if (current.path.has(current.id)) {
        possibleLoop = true;
        continue;
      }

      steps.push({ nodeId: node.nodeId, nodeType: node.type, status: "would_run" });
      const nextPath = new Set(current.path);
      nextPath.add(current.id);
      for (const next of adjacency.get(current.id) ?? []) {
        queue.push({ id: next, path: nextPath });
      }
    }

    if (guard >= 10000) possibleLoop = true;
    return { ...validation, steps, possibleLoop };
  }
}
