import type { WorkflowDefinition } from "@mgr/legacy-contracts";
import type { WorkflowRepository } from "@mgr/legacy-workflow";
import type { SqlExecutor } from "./sql.js";

export class PostgresWorkflowRepository implements WorkflowRepository {
  constructor(private readonly db:SqlExecutor,private readonly tenantId:string){}

  async save(definition:WorkflowDefinition):Promise<void>{
    await this.db.query(
      `INSERT INTO workflow_definitions
       (tenant_id,workflow_id,version,name,status,trigger,graph)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)`,
      [
        this.tenantId,definition.workflowId,definition.version,definition.name,definition.status,
        JSON.stringify(definition.trigger),
        JSON.stringify({nodes:definition.nodes,edges:definition.edges})
      ]
    );
  }

  async get(workflowId:string,version:number):Promise<WorkflowDefinition|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM workflow_definitions WHERE tenant_id=$1 AND workflow_id=$2 AND version=$3 LIMIT 1",
      [this.tenantId,workflowId,version]
    );
    return result.rows[0] ? this.fromRow(result.rows[0]) : null;
  }

  async latest(workflowId:string):Promise<WorkflowDefinition|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM workflow_definitions WHERE tenant_id=$1 AND workflow_id=$2 ORDER BY version DESC LIMIT 1",
      [this.tenantId,workflowId]
    );
    return result.rows[0] ? this.fromRow(result.rows[0]) : null;
  }

  async activate(workflowId:string,version:number):Promise<void>{
    await this.db.query(
      `UPDATE workflow_definitions SET status='retired'
       WHERE tenant_id=$1 AND workflow_id=$2 AND status='active'`,
      [this.tenantId,workflowId]
    );
    const result=await this.db.query(
      `UPDATE workflow_definitions SET status='active'
       WHERE tenant_id=$1 AND workflow_id=$2 AND version=$3 RETURNING workflow_id`,
      [this.tenantId,workflowId,version]
    );
    if(result.rowCount!==1) throw new Error("Workflow version not found");
  }

  async retire(workflowId:string,version:number):Promise<void>{
    const result=await this.db.query(
      `UPDATE workflow_definitions SET status='retired'
       WHERE tenant_id=$1 AND workflow_id=$2 AND version=$3 RETURNING workflow_id`,
      [this.tenantId,workflowId,version]
    );
    if(result.rowCount!==1) throw new Error("Workflow version not found");
  }

  async list(status?:WorkflowDefinition["status"]):Promise<WorkflowDefinition[]>{
    const result=status
      ? await this.db.query<any>(
          "SELECT * FROM workflow_definitions WHERE tenant_id=$1 AND status=$2 ORDER BY workflow_id,version",
          [this.tenantId,status]
        )
      : await this.db.query<any>(
          "SELECT * FROM workflow_definitions WHERE tenant_id=$1 ORDER BY workflow_id,version",
          [this.tenantId]
        );
    return result.rows.map(row=>this.fromRow(row));
  }

  private fromRow(row:any):WorkflowDefinition{
    return {
      workflowId:row.workflow_id,
      version:row.version,
      name:row.name,
      status:row.status,
      trigger:row.trigger,
      nodes:row.graph?.nodes ?? [],
      edges:row.graph?.edges ?? []
    };
  }
}
