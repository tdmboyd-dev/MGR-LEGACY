import { randomUUID } from "node:crypto";
import type { Command, LegacyEvent } from "@mgr/legacy-contracts";
import type { EventLedger } from "./event-ledger.js";
import type { PolicyEngine, PolicyContext } from "./policy.js";

export interface CommandHandler {
  action: string;
  resourceType: string;
  handle(command: Command): Promise<{ subject: LegacyEvent["subject"]; before?: unknown; after?: unknown; data?: Record<string, unknown> }>;
}

export class CommandBus {
  private readonly handlers = new Map<string, CommandHandler>();

  constructor(
    private readonly policy: PolicyEngine,
    private readonly ledger: EventLedger
  ) {}

  register(handler: CommandHandler): void {
    if (this.handlers.has(handler.action)) throw new Error(`Handler already registered: ${handler.action}`);
    this.handlers.set(handler.action, handler);
  }

  async execute(command: Command, context: Omit<PolicyContext, "action" | "resourceType">): Promise<{
    accepted: boolean;
    approvalRequired: boolean;
    event?: LegacyEvent;
    reason?: string;
  }> {
    const handler = this.handlers.get(command.action);
    if (!handler) throw new Error(`No handler registered for ${command.action}`);

    const decision = this.policy.evaluate({
      ...context,
      action: command.action,
      resourceType: handler.resourceType
    });

    if (!decision.allowed) return { accepted: false, approvalRequired: false, reason: decision.reason };
    if (decision.approval.required) {
      return { accepted: false, approvalRequired: true, reason: decision.approval.reason };
    }

    const result = await handler.handle(command);
    const event: LegacyEvent = {
      eventId: randomUUID(),
      eventType: `${handler.resourceType}.${command.action}`,
      eventVersion: 1,
      occurredAt: new Date().toISOString(),
      actor: command.actor,
      scope: command.scope,
      subject: result.subject,
      source: "command_bus",
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
      before: result.before,
      after: result.after,
      data: result.data ?? {},
      evidence: { commandId: command.commandId }
    };

    await this.ledger.append(event);
    return { accepted: true, approvalRequired: false, event };
  }
}
