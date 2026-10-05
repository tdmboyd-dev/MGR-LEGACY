import type { Booking, Company, Contact, Opportunity, Pipeline, PipelineStage, Task } from "./types.js";

export interface EntityRepository<T extends { id: string; tenantId: string }> {
  create(value: T): Promise<T>;
  get(tenantId: string, id: string): Promise<T | null>;
  update(tenantId: string, id: string, patch: Partial<T>): Promise<T>;
  list(tenantId: string): Promise<T[]>;
  delete(tenantId: string, id: string): Promise<void>;
}

export class InMemoryEntityRepository<T extends { id: string; tenantId: string }> implements EntityRepository<T> {
  private readonly rows = new Map<string, T>();

  private key(tenantId: string, id: string): string {
    return `${tenantId}:${id}`;
  }

  async create(value: T): Promise<T> {
    const key = this.key(value.tenantId, value.id);
    if (this.rows.has(key)) throw new Error(`Duplicate entity: ${value.id}`);
    this.rows.set(key, structuredClone(value));
    return structuredClone(value);
  }

  async get(tenantId: string, id: string): Promise<T | null> {
    return structuredClone(this.rows.get(this.key(tenantId, id)) ?? null);
  }

  async update(tenantId: string, id: string, patch: Partial<T>): Promise<T> {
    const key = this.key(tenantId, id);
    const current = this.rows.get(key);
    if (!current) throw new Error(`Entity not found: ${id}`);
    const next = { ...current, ...structuredClone(patch), id: current.id, tenantId: current.tenantId };
    this.rows.set(key, next);
    return structuredClone(next);
  }

  async list(tenantId: string): Promise<T[]> {
    return structuredClone([...this.rows.values()].filter((row) => row.tenantId === tenantId));
  }

  async delete(tenantId: string, id: string): Promise<void> {
    this.rows.delete(this.key(tenantId, id));
  }
}

export interface CrmRepositories {
  contacts: EntityRepository<Contact>;
  companies: EntityRepository<Company>;
  pipelines: EntityRepository<Pipeline>;
  stages: EntityRepository<PipelineStage>;
  opportunities: EntityRepository<Opportunity>;
  tasks: EntityRepository<Task>;
  bookings: EntityRepository<Booking>;
}

export function createInMemoryCrmRepositories(): CrmRepositories {
  return {
    contacts: new InMemoryEntityRepository<Contact>(),
    companies: new InMemoryEntityRepository<Company>(),
    pipelines: new InMemoryEntityRepository<Pipeline>(),
    stages: new InMemoryEntityRepository<PipelineStage>(),
    opportunities: new InMemoryEntityRepository<Opportunity>(),
    tasks: new InMemoryEntityRepository<Task>(),
    bookings: new InMemoryEntityRepository<Booking>()
  };
}
