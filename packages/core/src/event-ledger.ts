import type { LegacyEvent } from "@mgr/legacy-contracts";

export interface EventLedger {
  append(event: LegacyEvent): Promise<void>;
  getById(eventId: string): Promise<LegacyEvent | null>;
  listBySubject(entityType: string, entityId: string): Promise<LegacyEvent[]>;
  listByCorrelation(correlationId: string): Promise<LegacyEvent[]>;
}

export class InMemoryEventLedger implements EventLedger {
  private readonly events: LegacyEvent[] = [];
  private readonly idempotency = new Set<string>();

  async append(event: LegacyEvent): Promise<void> {
    if (this.idempotency.has(event.idempotencyKey)) return;
    if (this.events.some((item) => item.eventId === event.eventId)) {
      throw new Error(`Duplicate eventId: ${event.eventId}`);
    }
    this.idempotency.add(event.idempotencyKey);
    this.events.push(structuredClone(event));
  }

  async getById(eventId: string): Promise<LegacyEvent | null> {
    return structuredClone(this.events.find((event) => event.eventId === eventId) ?? null);
  }

  async listBySubject(entityType: string, entityId: string): Promise<LegacyEvent[]> {
    return structuredClone(this.events.filter(
      (event) => event.subject.entityType === entityType && event.subject.entityId === entityId
    ));
  }

  async listByCorrelation(correlationId: string): Promise<LegacyEvent[]> {
    return structuredClone(this.events.filter((event) => event.correlationId === correlationId));
  }
}
