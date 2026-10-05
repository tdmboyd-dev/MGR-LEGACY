import type { Command, LegacyEvent, NextAction, WorkflowDefinition } from "@mgr/legacy-contracts";

export interface LegacyTransport {
  request<T>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T>;
}

export class LegacyClient {
  constructor(private readonly transport: LegacyTransport) {}

  execute(command: Command): Promise<{ accepted: boolean; event?: LegacyEvent; approvalId?: string }> {
    return this.transport.request("POST", "/v1/commands", command);
  }

  getToday(ownerId: string): Promise<NextAction[]> {
    return this.transport.request("GET", `/v1/today?ownerId=${encodeURIComponent(ownerId)}`);
  }

  stageWorkflow(workflow: WorkflowDefinition): Promise<{ workflowId: string; version: number }> {
    return this.transport.request("POST", "/v1/workflows/stage", workflow);
  }

  simulateWorkflow(workflowId: string, version: number, eventIds: string[]): Promise<unknown> {
    return this.transport.request("POST", "/v1/workflows/simulate", { workflowId, version, eventIds });
  }
}

export * from "@mgr/legacy-contracts";
