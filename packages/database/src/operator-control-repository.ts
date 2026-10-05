import type {
  ActionReceipt,
  ActionReceiptStatus,
  ActionReceiptStore,
  AutonomySignals,
  ExecutionMode
} from "@mgr/legacy-core";
import type { SqlExecutor } from "./sql.js";

export class PostgresActionReceiptRepository implements ActionReceiptStore {
  constructor(private readonly db:SqlExecutor){}

  async append(receipt:ActionReceipt):Promise<void>{
    await this.db.query(
      `INSERT INTO action_receipts (
        receipt_id,tenant_id,correlation_id,causation_id,actor_type,actor_id,scope_type,scope_id,
        action,target_type,target_id,execution_mode,status,argument_summary,policy_decision,policy_reason,
        approvals,evidence,provider,started_at,completed_at,outcome,error,reversible,rollback_receipt_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16,$17::jsonb,$18::jsonb,
        $19::jsonb,$20,$21,$22::jsonb,$23,$24,$25
      )
      ON CONFLICT (receipt_id) DO UPDATE SET
        status=EXCLUDED.status,
        approvals=EXCLUDED.approvals,
        evidence=EXCLUDED.evidence,
        provider=EXCLUDED.provider,
        completed_at=EXCLUDED.completed_at,
        outcome=EXCLUDED.outcome,
        error=EXCLUDED.error,
        rollback_receipt_id=EXCLUDED.rollback_receipt_id`,
      [
        receipt.receiptId,receipt.tenantId,receipt.correlationId,receipt.causationId ?? null,
        receipt.actor.actorType,receipt.actor.actorId,receipt.scope.scopeType,receipt.scope.scopeId,
        receipt.action,receipt.target?.entityType ?? null,receipt.target?.entityId ?? null,
        receipt.executionMode,receipt.status,JSON.stringify(receipt.argumentSummary),
        receipt.policyDecision,receipt.policyReason ?? null,JSON.stringify(receipt.approvals),
        JSON.stringify(receipt.evidence),receipt.provider ? JSON.stringify(receipt.provider) : null,
        receipt.startedAt,receipt.completedAt ?? null,
        receipt.outcome ? JSON.stringify(receipt.outcome) : null,receipt.error ?? null,
        receipt.reversible,receipt.rollbackReceiptId ?? null
      ]
    );
  }

  async get(tenantId:string,receiptId:string):Promise<ActionReceipt|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM action_receipts WHERE tenant_id=$1 AND receipt_id=$2 LIMIT 1",
      [tenantId,receiptId]
    );
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async list(input:{
    tenantId:string;
    correlationId?:string;
    actorId?:string;
    action?:string;
    status?:ActionReceiptStatus;
    limit?:number;
  }):Promise<ActionReceipt[]>{
    const params:any[]=[input.tenantId];
    const clauses=["tenant_id=$1"];
    const add=(sql:string,value:any)=>{params.push(value);clauses.push(sql.replace("?",`$${params.length}`));};
    if(input.correlationId) add("correlation_id=?",input.correlationId);
    if(input.actorId) add("actor_id=?",input.actorId);
    if(input.action) add("action=?",input.action);
    if(input.status) add("status=?",input.status);
    params.push(input.limit ?? 200);
    const result=await this.db.query<any>(
      `SELECT * FROM action_receipts
       WHERE ${clauses.join(" AND ")}
       ORDER BY started_at DESC
       LIMIT $${params.length}`,
      params
    );
    return result.rows.map(row=>this.map(row));
  }

  private map(row:any):ActionReceipt{
    return {
      receiptId:row.receipt_id,
      tenantId:row.tenant_id,
      correlationId:row.correlation_id,
      causationId:row.causation_id ?? undefined,
      actor:{actorType:row.actor_type,actorId:row.actor_id,tenantId:row.tenant_id},
      scope:{tenantId:row.tenant_id,scopeType:row.scope_type,scopeId:row.scope_id},
      action:row.action,
      target:row.target_type && row.target_id ? {entityType:row.target_type,entityId:row.target_id} : undefined,
      executionMode:row.execution_mode,
      status:row.status,
      argumentSummary:row.argument_summary ?? {},
      policyDecision:row.policy_decision,
      policyReason:row.policy_reason ?? undefined,
      approvals:row.approvals ?? [],
      evidence:row.evidence ?? {},
      provider:row.provider ?? undefined,
      startedAt:new Date(row.started_at).toISOString(),
      completedAt:row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
      outcome:row.outcome ?? undefined,
      error:row.error ?? undefined,
      reversible:Boolean(row.reversible),
      rollbackReceiptId:row.rollback_receipt_id ?? undefined
    } as ActionReceipt;
  }
}

export interface AutonomyProfile {
  tenantId:string;
  subjectType:string;
  subjectId:string;
  executionMode:ExecutionMode;
  signals:AutonomySignals;
}

export class PostgresAutonomyProfileRepository {
  constructor(private readonly db:SqlExecutor){}

  async save(profile:AutonomyProfile):Promise<void>{
    const s=profile.signals;
    await this.db.query(
      `INSERT INTO autonomy_profiles (
        tenant_id,subject_type,subject_id,execution_mode,successful_runs,failed_runs,blocked_runs,
        approval_override_rate,rollback_rate,critical_incidents,evidence_coverage
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (tenant_id,subject_type,subject_id) DO UPDATE SET
        execution_mode=EXCLUDED.execution_mode,
        successful_runs=EXCLUDED.successful_runs,
        failed_runs=EXCLUDED.failed_runs,
        blocked_runs=EXCLUDED.blocked_runs,
        approval_override_rate=EXCLUDED.approval_override_rate,
        rollback_rate=EXCLUDED.rollback_rate,
        critical_incidents=EXCLUDED.critical_incidents,
        evidence_coverage=EXCLUDED.evidence_coverage,
        updated_at=now()`,
      [profile.tenantId,profile.subjectType,profile.subjectId,profile.executionMode,s.successfulRuns,
       s.failedRuns,s.blockedRuns,s.approvalOverrideRate,s.rollbackRate,s.criticalIncidents,s.evidenceCoverage]
    );
  }

  async get(tenantId:string,subjectType:string,subjectId:string):Promise<AutonomyProfile|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM autonomy_profiles WHERE tenant_id=$1 AND subject_type=$2 AND subject_id=$3 LIMIT 1",
      [tenantId,subjectType,subjectId]
    );
    const row=result.rows[0];
    if(!row) return null;
    return {
      tenantId:row.tenant_id,
      subjectType:row.subject_type,
      subjectId:row.subject_id,
      executionMode:row.execution_mode,
      signals:{
        successfulRuns:row.successful_runs,
        failedRuns:row.failed_runs,
        blockedRuns:row.blocked_runs,
        approvalOverrideRate:Number(row.approval_override_rate),
        rollbackRate:Number(row.rollback_rate),
        criticalIncidents:row.critical_incidents,
        evidenceCoverage:Number(row.evidence_coverage)
      }
    };
  }
}
