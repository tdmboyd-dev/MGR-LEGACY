import type { WorkflowDefinition } from "@mgr/legacy-contracts";

export type ConflictSeverity = "info" | "warning" | "critical";

export interface WorkflowConflict {
  type: "duplicate_action" | "competing_update" | "recursive_trigger" | "audience_overlap";
  severity: ConflictSeverity;
  workflowIds: string[];
  details: string;
}

export class AutomationConflictDetector {
  detect(workflows: WorkflowDefinition[]): WorkflowConflict[] {
    const conflicts: WorkflowConflict[] = [];
    const active = workflows.filter((workflow) => workflow.status === "active" || workflow.status === "staged");

    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i]!;
        const b = active[j]!;
        const sameTrigger = a.trigger.type === b.trigger.type && JSON.stringify(a.trigger.config) === JSON.stringify(b.trigger.config);
        if (!sameTrigger) continue;

        const aActions = new Set(a.nodes.map((node) => `${node.type}:${JSON.stringify(node.config)}`));
        const duplicates = b.nodes.filter((node) => aActions.has(`${node.type}:${JSON.stringify(node.config)}`));
        if (duplicates.length) {
          conflicts.push({
            type: "duplicate_action",
            severity: "warning",
            workflowIds: [a.workflowId, b.workflowId],
            details: `Same trigger can execute ${duplicates.length} identical action(s)`
          });
        }

        const aUpdates = a.nodes.filter((node) => node.type === "update_entity");
        const bUpdates = b.nodes.filter((node) => node.type === "update_entity");
        if (aUpdates.length && bUpdates.length) {
          conflicts.push({
            type: "competing_update",
            severity: "critical",
            workflowIds: [a.workflowId, b.workflowId],
            details: "Same trigger has multiple entity-update automations; evaluate field-level collision"
          });
        }
      }
    }

    return conflicts;
  }
}
