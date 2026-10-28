import {isDeepStrictEqual} from "node:util";
import type { LegacyEvent } from "@mgr/legacy-contracts";

export interface EventLedger {
  append(event: LegacyEvent): Promise<void>;
  getById(tenantId:string,eventId: string): Promise<LegacyEvent | null>;
  listBySubject(tenantId:string,entityType: string, entityId: string): Promise<LegacyEvent[]>;
  listByCorrelation(tenantId:string,correlationId: string): Promise<LegacyEvent[]>;
}

export class InMemoryEventLedger implements EventLedger {
  private readonly events: LegacyEvent[] = [];
  private readonly idempotency = new Set<string>();

  async append(event: LegacyEvent): Promise<void> {
    if(event.actor.tenantId!==event.scope.tenantId) throw new Error("Tenant mismatch");
    const key=JSON.stringify([event.scope.tenantId,event.idempotencyKey]);
    if (this.idempotency.has(key)){
      const prior=this.events.find(item=>item.scope.tenantId===event.scope.tenantId && item.idempotencyKey===event.idempotencyKey);
      if(!isDeepStrictEqual(prior,event))throw new Error("Event idempotency conflict");
      return;
    }
    if (this.events.some((item) => item.eventId === event.eventId)) {
      throw new Error(`Duplicate eventId: ${event.eventId}`);
    }
    this.idempotency.add(key);
    this.events.push(structuredClone(event));
  }

  async getById(tenantId:string,eventId: string): Promise<LegacyEvent | null> {
    return structuredClone(this.events.find((event) => event.scope.tenantId===tenantId && event.eventId === eventId) ?? null);
  }

  async listBySubject(tenantId:string,entityType: string, entityId: string): Promise<LegacyEvent[]> {
    return structuredClone(this.events.filter(
      (event) => event.scope.tenantId===tenantId && event.subject.entityType === entityType && event.subject.entityId === entityId
    ));
  }

  async listByCorrelation(tenantId:string,correlationId: string): Promise<LegacyEvent[]> {
    return structuredClone(this.events.filter((event) => event.scope.tenantId===tenantId && event.correlationId === correlationId));
  }
}
