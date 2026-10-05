import type { CreationJob, MediaJobLedger } from "@mgr/legacy-core";
import type { DeadLetterItem, DeadLetterStore } from "@mgr/legacy-workflow";
import type { ConnectorManifest } from "@mgr/legacy-extensions";
import type { SqlExecutor } from "./sql.js";

export class PostgresMediaJobLedger implements MediaJobLedger {
  constructor(private readonly db:SqlExecutor){}

  async save(job:CreationJob):Promise<void>{
    await this.db.query(
      `INSERT INTO creation_jobs (
        job_id,tenant_id,job_type,prompt,inputs,provider,model,status,created_at,started_at,
        completed_at,cost,outputs,evidence,error
      ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15)
      ON CONFLICT (job_id) DO UPDATE SET
        provider=EXCLUDED.provider,model=EXCLUDED.model,status=EXCLUDED.status,
        started_at=EXCLUDED.started_at,completed_at=EXCLUDED.completed_at,cost=EXCLUDED.cost,
        outputs=EXCLUDED.outputs,evidence=EXCLUDED.evidence,error=EXCLUDED.error`,
      [
        job.jobId,job.tenantId,job.type,job.prompt,JSON.stringify(job.inputs),job.provider ?? null,
        job.model ?? null,job.status,job.createdAt,job.startedAt ?? null,job.completedAt ?? null,
        job.cost ?? null,JSON.stringify(job.outputs),JSON.stringify(job.evidence),job.error ?? null
      ]
    );
  }

  async get(tenantId:string,jobId:string):Promise<CreationJob|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM creation_jobs WHERE tenant_id=$1 AND job_id=$2 LIMIT 1",
      [tenantId,jobId]
    );
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async list(tenantId:string,limit=100):Promise<CreationJob[]>{
    const result=await this.db.query<any>(
      "SELECT * FROM creation_jobs WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT $2",
      [tenantId,limit]
    );
    return result.rows.map(row=>this.map(row));
  }

  private map(row:any):CreationJob{
    return {
      jobId:row.job_id,tenantId:row.tenant_id,type:row.job_type,prompt:row.prompt,
      inputs:row.inputs ?? [],provider:row.provider ?? undefined,model:row.model ?? undefined,
      status:row.status,createdAt:new Date(row.created_at).toISOString(),
      startedAt:row.started_at ? new Date(row.started_at).toISOString() : undefined,
      completedAt:row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
      cost:row.cost===null ? undefined : Number(row.cost),outputs:row.outputs ?? [],
      evidence:row.evidence ?? {},error:row.error ?? undefined
    };
  }
}

export class PostgresDeadLetterStore implements DeadLetterStore {
  constructor(private readonly db:SqlExecutor){}

  async add(item:DeadLetterItem):Promise<void>{
    await this.db.query(
      `INSERT INTO workflow_dead_letters
       (id,tenant_id,workflow_id,run_id,node_id,error,payload,attempts,failed_at,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET error=EXCLUDED.error,payload=EXCLUDED.payload,
       attempts=EXCLUDED.attempts,status=EXCLUDED.status`,
      [
        item.id,item.tenantId,item.workflowId,item.runId,item.nodeId ?? null,item.error,
        JSON.stringify(item.payload),item.attempts,item.failedAt,item.status
      ]
    );
  }

  async listOpen(tenantId:string,limit=100):Promise<DeadLetterItem[]>{
    const result=await this.db.query<any>(
      `SELECT * FROM workflow_dead_letters
       WHERE tenant_id=$1 AND status='open'
       ORDER BY failed_at DESC LIMIT $2`,
      [tenantId,limit]
    );
    return result.rows.map(row=>({
      id:row.id,tenantId:row.tenant_id,workflowId:row.workflow_id,runId:row.run_id,
      nodeId:row.node_id ?? undefined,error:row.error,payload:row.payload ?? {},
      attempts:row.attempts,failedAt:new Date(row.failed_at).toISOString(),status:row.status
    }));
  }

  async updateStatus(id:string,status:DeadLetterItem["status"]):Promise<void>{
    await this.db.query("UPDATE workflow_dead_letters SET status=$2 WHERE id=$1",[id,status]);
  }
}

export class PostgresConnectorManifestRepository {
  constructor(private readonly db:SqlExecutor){}

  async save(manifest:ConnectorManifest):Promise<void>{
    await this.db.query(
      `INSERT INTO connector_manifests
       (id,version,transport,endpoint,capabilities,required_secrets,enabled)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)
       ON CONFLICT (id,version) DO UPDATE SET
       transport=EXCLUDED.transport,endpoint=EXCLUDED.endpoint,capabilities=EXCLUDED.capabilities,
       required_secrets=EXCLUDED.required_secrets,enabled=EXCLUDED.enabled`,
      [
        manifest.id,manifest.version,manifest.transport,manifest.endpoint ?? null,
        JSON.stringify(manifest.capabilities),JSON.stringify(manifest.requiredSecrets),manifest.enabled
      ]
    );
  }

  async list():Promise<ConnectorManifest[]>{
    const result=await this.db.query<any>(
      "SELECT * FROM connector_manifests ORDER BY id,version DESC"
    );
    return result.rows.map(row=>({
      id:row.id,version:row.version,transport:row.transport,endpoint:row.endpoint ?? undefined,
      capabilities:row.capabilities ?? [],requiredSecrets:row.required_secrets ?? [],enabled:row.enabled
    }));
  }
}
