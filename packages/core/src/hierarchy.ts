export type HierarchyNodeType =
  | "organization"
  | "workspace"
  | "bureau"
  | "office"
  | "team";

export interface HierarchyNode {
  id: string;
  tenantId: string;
  type: HierarchyNodeType;
  name: string;
  parentId?: string;
  active: boolean;
}

export class HierarchyGraph {
  private readonly nodes = new Map<string, HierarchyNode>();

  add(node: HierarchyNode): void {
    if (this.nodes.has(node.id)) throw new Error(`Hierarchy node exists: ${node.id}`);
    if (node.parentId && !this.nodes.has(node.parentId)) throw new Error(`Unknown parent: ${node.parentId}`);
    if (node.parentId && this.nodes.get(node.parentId)?.tenantId !== node.tenantId) {
      throw new Error("Cross-tenant hierarchy link denied");
    }
    this.nodes.set(node.id, structuredClone(node));
  }

  get(id: string): HierarchyNode | null {
    return structuredClone(this.nodes.get(id) ?? null);
  }

  ancestors(id: string): HierarchyNode[] {
    const result: HierarchyNode[] = [];
    let current = this.nodes.get(id);
    const visited = new Set<string>();

    while (current?.parentId) {
      if (visited.has(current.id)) throw new Error("Hierarchy cycle detected");
      visited.add(current.id);
      const parent = this.nodes.get(current.parentId);
      if (!parent) throw new Error(`Broken hierarchy at ${current.parentId}`);
      result.push(parent);
      current = parent;
    }
    return structuredClone(result);
  }

  descendants(id: string): HierarchyNode[] {
    const result: HierarchyNode[] = [];
    const queue = [id];
    const visited = new Set<string>();

    while (queue.length) {
      const parentId = queue.shift()!;
      if (visited.has(parentId)) continue;
      visited.add(parentId);
      for (const node of this.nodes.values()) {
        if (node.parentId === parentId) {
          result.push(node);
          queue.push(node.id);
        }
      }
    }

    return structuredClone(result);
  }

  isWithinScope(nodeId: string, allowedScopeId: string): boolean {
    if (nodeId === allowedScopeId) return true;
    return this.ancestors(nodeId).some((node) => node.id === allowedScopeId);
  }
}
