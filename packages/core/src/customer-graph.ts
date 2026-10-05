import type { EntityRef, Relationship } from "@mgr/legacy-contracts";

export interface GraphEntity {
  id: string;
  tenantId: string;
  type: EntityRef["entityType"];
  displayName: string;
  attributes: Record<string, unknown>;
}

export class CustomerGraph {
  private readonly entities = new Map<string, GraphEntity>();
  private readonly relationships = new Map<string, Relationship>();

  addEntity(entity: GraphEntity): void {
    const key = `${entity.tenantId}:${entity.type}:${entity.id}`;
    if (this.entities.has(key)) throw new Error(`Entity already exists: ${key}`);
    this.entities.set(key, structuredClone(entity));
  }

  getEntity(tenantId: string, type: GraphEntity["type"], id: string): GraphEntity | null {
    return structuredClone(this.entities.get(`${tenantId}:${type}:${id}`) ?? null);
  }

  link(relationship: Relationship): void {
    const from = this.getEntity(relationship.tenantId, relationship.from.entityType, relationship.from.entityId);
    const to = this.getEntity(relationship.tenantId, relationship.to.entityType, relationship.to.entityId);
    if (!from || !to) throw new Error("Relationship endpoints must exist in the same tenant");
    this.relationships.set(relationship.id, structuredClone(relationship));
  }

  neighbors(tenantId: string, ref: EntityRef): Relationship[] {
    return structuredClone([...this.relationships.values()].filter((edge) =>
      edge.tenantId === tenantId &&
      ((edge.from.entityType === ref.entityType && edge.from.entityId === ref.entityId) ||
       (edge.to.entityType === ref.entityType && edge.to.entityId === ref.entityId))
    ));
  }
}
