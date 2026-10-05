import type { SqlExecutor } from "./sql.js";
import type { ExecutionCheckpoint, ReplayRequest } from "@mgr/legacy-workflow";

export class PostgresWorkflowCheckpointRepository {
  constructor(private readonly db:SqlExecutor){}

  async upsert(checkpoint:ExecutionCheckpoint):Promise<void>{
    await this.db.query(
      `INSERT INTO workflow_checkpoints
       (run_id,node_id,workflow_id,workflow_version,attempt,status,input,output,error,next_attempt_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11)
       ON CONFLICT (run_id,node_id)
       DO UPDATE SET
         workflow_id=EXCLUDED.workflow_id,
         workflow_version=EXCLUDED.workflow_version,
         attempt=EXCLUDED.attempt,
         status=EXCLUDED.status,
         input=EXCLUDED.input,
         output=EXCLUDED.output,
         error=EXCLUDED.error,
         next_attempt_at=EXCLUDED.next_attempt_at,
         updated_at=EXCLUDED.updated_at`,
      [
        checkpoint.runId,
        checkpoint.nodeId,
        checkpoint.workflowId,
        checkpoint.workflowVersion,
        checkpoint.attempt,
        checkpoint.status,
        JSON.stringify(checkpoint.input ?? null),
        JSON.stringify(checkpoint.output ?? null),
        checkpoint.error ?? null,
        checkpoint.nextAttemptAt ?? null,
        checkpoint.updatedAt
      ]
    );
  }

  async get(runId:string,nodeId:string):Promise<ExecutionCheckpoint|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM workflow_checkpoints WHERE run_id=$1 AND node_id=$2 LIMIT 1",
      [runId,nodeId]
    );
    return result.rows[0] ? this.fromRow(result.rows[0]) : null;
  }

  async listRun(runId:string):Promise<ExecutionCheckpoint[]>{
    const result=await this.db.query<any>(
      "SELECT * FROM workflow_checkpoints WHERE run_id=$1 ORDER BY updated_at,node_id",
      [runId]
    );
    return result.rows.map(row=>this.fromRow(row));
  }

  async listResumeCandidates(now=new Date(),limit=100):Promise<ExecutionCheckpoint[]>{
    const result=await this.db.query<any>(
      `SELECT * FROM workflow_checkpoints
       WHERE status='pending'
          OR (status='waiting' AND next_attempt_at IS NOT NULL AND next_attempt_at <= $1)
       ORDER BY COALESCE(next_attempt_at,updated_at),updated_at
       LIMIT $2`,
      [now.toISOString(),limit]
    );
    return result.rows.map(row=>this.fromRow(row));
  }

  private fromRow(row:any):ExecutionCheckpoint{
    return {
      runId:row.run_id,
      workflowId:row.workflow_id,
      workflowVersion:row.workflow_version,
      nodeId:row.node_id,
      attempt:row.attempt,
      status:row.status,
      input:row.input ?? undefined,
      output:row.output ?? undefined,
      error:row.error ?? undefined,
      nextAttemptAt:row.next_attempt_at ? new Date(row.next_attempt_at).toISOString() : undefined,
      updatedAt:new Date(row.updated_at).toISOString()
    };
  }
}

export class PostgresWorkflowReplayRepository {
  constructor(private readonly db:SqlExecutor){}

  async create(request:ReplayRequest):Promise<string>{
    const result=await this.db.query<{id:string}>(
      `INSERT INTO workflow_replay_requests
       (source_run_id,workflow_id,workflow_version,from_node_id,reason,requested_by,requested_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [
        request.sourceRunId,
        request.workflowId,
        request.workflowVersion,
        request.fromNodeId ?? null,
        request.reason,
        request.requestedBy,
        request.requestedAt
      ]
    );
    return result.rows[0]!.id;
  }

  async attachReplayRun(requestId:string,replayRunId:string):Promise<void>{
    await this.db.query(
      `UPDATE workflow_replay_requests
       SET replay_run_id=$2,status='running'
       WHERE id=$1`,
      [requestId,replayRunId]
    );
  }

  async complete(requestId:string,status:"completed"|"failed"|"cancelled"):Promise<void>{
    await this.db.query(
      "UPDATE workflow_replay_requests SET status=$2 WHERE id=$1",
      [requestId,status]
    );
  }
}
