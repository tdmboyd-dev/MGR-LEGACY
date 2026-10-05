import type { Command, LegacyEvent, NextAction, WorkflowDefinition } from "@mgr/legacy-contracts";
import type { ActionReceipt, ActionReceiptStatus, TruthConsoleRow } from "@mgr/legacy-core";

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

  getActionReceipts(filters: {
    correlationId?: string;
    actorId?: string;
    action?: string;
    status?: ActionReceiptStatus;
    limit?: number;
  } = {}): Promise<ActionReceipt[]> {
    const query = new URLSearchParams();
    if (filters.correlationId) query.set("correlationId", filters.correlationId);
    if (filters.actorId) query.set("actorId", filters.actorId);
    if (filters.action) query.set("action", filters.action);
    if (filters.status) query.set("status", filters.status);
    if (filters.limit !== undefined) query.set("limit", String(filters.limit));
    const suffix=query.size ? `?${query.toString()}` : "";
    return this.transport.request("GET", `/v1/truth/receipts${suffix}`);
  }

  getTruthConsole(filters: {
    correlationId?: string;
    actorId?: string;
    action?: string;
    status?: ActionReceiptStatus;
    limit?: number;
  } = {}): Promise<TruthConsoleRow[]> {
    const query = new URLSearchParams();
    if (filters.correlationId) query.set("correlationId", filters.correlationId);
    if (filters.actorId) query.set("actorId", filters.actorId);
    if (filters.action) query.set("action", filters.action);
    if (filters.status) query.set("status", filters.status);
    if (filters.limit !== undefined) query.set("limit", String(filters.limit));
    const suffix=query.size ? `?${query.toString()}` : "";
    return this.transport.request("GET", `/v1/truth/console${suffix}`);
  }

  getTruthSummary(filters: {
    correlationId?: string;
    actorId?: string;
    action?: string;
    status?: ActionReceiptStatus;
    limit?: number;
  } = {}): Promise<{
    total:number;
    succeeded:number;
    failed:number;
    blocked:number;
    approvalRate:number;
    totalProviderCost:number;
  }> {
    const query = new URLSearchParams();
    if (filters.correlationId) query.set("correlationId", filters.correlationId);
    if (filters.actorId) query.set("actorId", filters.actorId);
    if (filters.action) query.set("action", filters.action);
    if (filters.status) query.set("status", filters.status);
    if (filters.limit !== undefined) query.set("limit", String(filters.limit));
    const suffix=query.size ? `?${query.toString()}` : "";
    return this.transport.request("GET", `/v1/truth/summary${suffix}`);
  }
}

export * from "@mgr/legacy-contracts";
export * from "./extensions.js";
