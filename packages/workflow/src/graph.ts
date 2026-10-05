import type { WorkflowDefinition } from "@mgr/legacy-contracts";

export interface WorkflowValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateWorkflow(workflow: WorkflowDefinition): WorkflowValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodeIds = new Set(workflow.nodes.map((node) => node.nodeId));

  if (nodeIds.size !== workflow.nodes.length) errors.push("Duplicate workflow node ID");
  for (const edge of workflow.edges) {
    if (!nodeIds.has(edge.from)) errors.push(`Edge references missing from node: ${edge.from}`);
    if (!nodeIds.has(edge.to)) errors.push(`Edge references missing to node: ${edge.to}`);
  }

  const inbound = new Map<string, number>();
  for (const edge of workflow.edges) inbound.set(edge.to, (inbound.get(edge.to) ?? 0) + 1);
  const roots = workflow.nodes.filter((node) => !inbound.has(node.nodeId));
  if (roots.length === 0 && workflow.nodes.length > 0) warnings.push("Workflow has no root node; possible cycle");
  if (roots.length > 1) warnings.push("Workflow has multiple root nodes");

  return { valid: errors.length === 0, errors, warnings };
}
