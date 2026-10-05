import type { SqlExecutor } from "./sql.js";

export type StoredHierarchyNodeType="organization"|"workspace"|"bureau"|"office"|"team";

export interface StoredHierarchyNode {
  id:string;
  tenantId:string;
  parentId?:string;
  type:StoredHierarchyNodeType;
  name:string;
  active:boolean;
  metadata:Record<string,unknown>;
}

export class PostgresHierarchyRepository {
  constructor(private readonly db:SqlExecutor){}

  async create(node:StoredHierarchyNode):Promise<StoredHierarchyNode>{
    const result=await this.db.query<any>(
      `INSERT INTO hierarchy_nodes
       (id,tenant_id,parent_id,node_type,name,active,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
       RETURNING *`,
      [node.id,node.tenantId,node.parentId ?? null,node.type,node.name,node.active,JSON.stringify(node.metadata)]
    );
    return this.fromRow(result.rows[0]);
  }

  async get(tenantId:string,id:string):Promise<StoredHierarchyNode|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM hierarchy_nodes WHERE tenant_id=$1 AND id=$2 LIMIT 1",
      [tenantId,id]
    );
    return result.rows[0] ? this.fromRow(result.rows[0]) : null;
  }

  async listChildren(tenantId:string,parentId:string):Promise<StoredHierarchyNode[]>{
    const result=await this.db.query<any>(
      `SELECT * FROM hierarchy_nodes
       WHERE tenant_id=$1 AND parent_id=$2
       ORDER BY name,id`,
      [tenantId,parentId]
    );
    return result.rows.map(row=>this.fromRow(row));
  }

  async listDescendants(tenantId:string,parentId:string):Promise<StoredHierarchyNode[]>{
    const result=await this.db.query<any>(
      `WITH RECURSIVE tree AS (
         SELECT * FROM hierarchy_nodes WHERE tenant_id=$1 AND parent_id=$2
         UNION ALL
         SELECT child.*
         FROM hierarchy_nodes child
         JOIN tree parent ON child.parent_id=parent.id
         WHERE child.tenant_id=$1
       )
       SELECT * FROM tree ORDER BY name,id`,
      [tenantId,parentId]
    );
    return result.rows.map(row=>this.fromRow(row));
  }

  async update(node:StoredHierarchyNode):Promise<StoredHierarchyNode>{
    const result=await this.db.query<any>(
      `UPDATE hierarchy_nodes
       SET parent_id=$3,node_type=$4,name=$5,active=$6,metadata=$7::jsonb,updated_at=now()
       WHERE tenant_id=$1 AND id=$2
       RETURNING *`,
      [node.tenantId,node.id,node.parentId ?? null,node.type,node.name,node.active,JSON.stringify(node.metadata)]
    );
    if(result.rowCount!==1) throw new Error("Hierarchy node not found");
    return this.fromRow(result.rows[0]);
  }

  private fromRow(row:any):StoredHierarchyNode{
    return {
      id:row.id,
      tenantId:row.tenant_id,
      parentId:row.parent_id ?? undefined,
      type:row.node_type,
      name:row.name,
      active:row.active,
      metadata:row.metadata ?? {}
    };
  }
}
