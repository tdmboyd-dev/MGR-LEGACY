import { randomUUID } from "node:crypto";
import type { Command, LegacyEvent, NextAction, WorkflowDefinition } from "@mgr/legacy-contracts";
import type { Goal, ReportDefinition } from "@mgr/legacy-analytics";
import type { BankProductApplication, ClientPortalRequest, PreparerCredentialStatus, RequiredTaxDocument, SignatureAuthorization, TaxReturnLifecycleState } from "@mgr/legacy-tax-pack";
import { NextActionEngine, TruthConsoleProjector, type ActionReceipt, type ActionReceiptStatus } from "@mgr/legacy-core";
import {
  PostgresAnalyticsRepository,
  PostgresAuditStore,
  PostgresEventLedger,
  PostgresExtensionRepository,
  PostgresIdempotencyStore,
  PostgresOperationalTodayRepository,
  PostgresOutbox,
  PostgresActionReceiptRepository,
  PostgresShadowIngestRepository,
  PostgresTaxPackRepository,
  PostgresWorkflowRepository,
  type PostgresDatabase,
  type SqlExecutor
} from "@mgr/legacy-database";
import { WorkflowSimulator, WorkflowVersionService } from "@mgr/legacy-workflow";
import type { CommandIngressInput, LegacyApiServices } from "./types.js";

function isCanonicalCommand(input:CommandIngressInput|Command):input is Command{
  return "commandId" in input && "scope" in input && "actor" in input;
}

function tenantFrom(input:CommandIngressInput|Command,defaultTenantId?:string):string|undefined{
  if(isCanonicalCommand(input)) return input.scope.tenantId;
  return String(input.metadata?.tenantId ?? defaultTenantId ?? "") || undefined;
}

export class DefaultLegacyApiServices implements LegacyApiServices {
  constructor(
    private readonly db:PostgresDatabase,
    private readonly defaultTenantId?:string
  ) {}

  async health():Promise<Record<string,unknown>>{
    const started=Date.now();
    await this.db.query("SELECT 1 AS ok");
    return {
      database:"ok",
      latencyMs:Date.now()-started,
      version:"0.1.0"
    };
  }

  async executeCommand(input:CommandIngressInput|Command):Promise<unknown>{
    if(!isCanonicalCommand(input) && input.metadata?.shadow===true){
      const repo=new PostgresShadowIngestRepository(this.db);
      const id=await repo.append({
        sourceSystem:String(input.metadata?.sourceSystem ?? "unknown"),
        action:input.action,
        tenantId:input.metadata?.tenantId ? String(input.metadata.tenantId) : undefined,
        userId:input.metadata?.userId ? String(input.metadata.userId) : undefined,
        sourceId:input.metadata?.sourceId ? String(input.metadata.sourceId) : undefined,
        correlationId:input.metadata?.correlationId ? String(input.metadata.correlationId) : undefined,
        payload:input.payload,
        metadata:input.metadata ?? {}
      });
      return {accepted:true,shadow:true,ingestId:id};
    }

    const tenantId=tenantFrom(input,this.defaultTenantId);
    if(!tenantId) throw new Error("tenantId is required");

    const command:Command=isCanonicalCommand(input)
      ? input
      : {
          commandId:randomUUID(),
          action:input.action,
          actor:{
            actorType:"service",
            actorId:String(input.metadata?.userId ?? input.metadata?.sourceSystem ?? "bridge"),
            tenantId
          },
          scope:{
            tenantId,
            scopeType:"organization",
            scopeId:String(input.metadata?.scopeId ?? tenantId)
          },
          target:input.payload.id
            ? {entityType:"custom",entityId:String(input.payload.id)}
            : undefined,
          payload:input.payload,
          idempotencyKey:String(input.metadata?.idempotencyKey ?? `${input.action}:${input.metadata?.sourceId ?? randomUUID()}`),
          correlationId:String(input.metadata?.correlationId ?? randomUUID())
        };

    return this.executeCanonical(command);
  }

  private async executeCanonical(command:Command):Promise<unknown>{
    const tx=await this.db.begin();
    const receipt:ActionReceipt={
      receiptId:randomUUID(),
      tenantId:command.scope.tenantId,
      correlationId:command.correlationId,
      actor:command.actor,
      scope:command.scope,
      action:command.action,
      target:command.target,
      executionMode:"ask",
      status:"executing",
      argumentSummary:command.payload,
      policyDecision:"allowed",
      approvals:[],
      evidence:{commandId:command.commandId,idempotencyKey:command.idempotencyKey},
      startedAt:new Date().toISOString(),
      reversible:true
    };
    const idempotency=new PostgresIdempotencyStore(tx);
    const audit=new PostgresAuditStore(tx);
    const events=new PostgresEventLedger(tx);
    const outbox=new PostgresOutbox(tx);
    const receipts=new PostgresActionReceiptRepository(tx);

    try{
      const existing=await idempotency.get(command.scope.tenantId,command.idempotencyKey);
      if(existing?.response){
        await tx.commit();
        return {...(existing.response as any),replayed:true};
      }

      const reserved=await idempotency.reserve(
        command.scope.tenantId,
        command.idempotencyKey,
        command.commandId
      );
      if(!reserved) throw new Error("Command already in progress");

      const mutation=await this.applyAction(tx,command);
      const event:LegacyEvent={
        eventId:randomUUID(),
        eventType:`${command.action}.completed`,
        eventVersion:1,
        occurredAt:new Date().toISOString(),
        actor:command.actor,
        scope:command.scope,
        subject:mutation.subject,
        source:"legacy_api",
        correlationId:command.correlationId,
        idempotencyKey:command.idempotencyKey,
        before:mutation.before,
        after:mutation.after,
        data:mutation.data ?? {},
        evidence:{commandId:command.commandId}
      };

      await events.append(event);
      await outbox.enqueue(event);
      await audit.append({
        tenantId:command.scope.tenantId,
        actorType:command.actor.actorType,
        actorId:command.actor.actorId,
        action:command.action,
        resourceType:mutation.subject.entityType,
        resourceId:mutation.subject.entityId,
        decision:"allowed",
        correlationId:command.correlationId,
        evidence:{eventId:event.eventId}
      });

      const response={
        accepted:true,
        event,
        result:mutation.after,
        receiptId:receipt.receiptId,
        correlationId:command.correlationId
      };
      await receipts.append({
        ...receipt,
        status:"succeeded",
        completedAt:new Date().toISOString(),
        outcome:{eventId:event.eventId,result:mutation.after}
      });
      await idempotency.complete(command.scope.tenantId,command.idempotencyKey,response);
      await tx.commit();
      return response;
    }catch(error){
      await tx.rollback();
      await new PostgresActionReceiptRepository(this.db).append({
        ...receipt,
        status:"failed",
        completedAt:new Date().toISOString(),
        error:error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async applyAction(tx:SqlExecutor,command:Command):Promise<{
    subject:LegacyEvent["subject"];
    before?:unknown;
    after?:unknown;
    data?:Record<string,unknown>;
  }>{
    const p=command.payload;
    const tenantId=command.scope.tenantId;

    switch(command.action){
      case "crm.create_contact":{
        const id=String(p.id ?? randomUUID());
        const firstName=String(p.firstName ?? p.first_name ?? "");
        if(!firstName) throw new Error("firstName is required");
        const attributes={
          firstName,
          lastName:p.lastName ?? p.last_name,
          email:p.email,
          phone:p.phone,
          company:p.company,
          jobTitle:p.jobTitle ?? p.job_title,
          source:p.source,
          tags:p.tags ?? [],
          score:p.score ?? 0,
          sourceOwnerId:p.ownerId ?? p.userId
        };
        await tx.query(
          `INSERT INTO entities
           (id,tenant_id,entity_type,display_name,lifecycle_state,attributes)
           VALUES ($1,$2,'person',$3,$4,$5::jsonb)`,
          [id,tenantId,[firstName,p.lastName ?? p.last_name].filter(Boolean).join(" "),String(p.status ?? "lead"),JSON.stringify(attributes)]
        );
        return {subject:{entityType:"person",entityId:id},after:{id,...attributes}};
      }
      case "crm.update_contact":{
        const id=String(p.id ?? p.contactId ?? command.target?.entityId ?? "");
        if(!id) throw new Error("contact id is required");
        const current=await tx.query<any>(
          "SELECT * FROM entities WHERE tenant_id=$1 AND id=$2 AND entity_type='person' LIMIT 1",
          [tenantId,id]
        );
        if(!current.rows[0]) throw new Error("Contact not found");
        const before=current.rows[0].attributes ?? {};
        const attributes={...before,...p};
        await tx.query(
          `UPDATE entities SET attributes=$3::jsonb,display_name=COALESCE($4,display_name),
           lifecycle_state=COALESCE($5,lifecycle_state),updated_at=now()
           WHERE tenant_id=$1 AND id=$2`,
          [
            tenantId,id,JSON.stringify(attributes),
            p.firstName ? [p.firstName,p.lastName].filter(Boolean).join(" ") : null,
            p.status ? String(p.status) : null
          ]
        );
        return {subject:{entityType:"person",entityId:id},before,after:attributes};
      }
      case "crm.create_opportunity":
      case "crm.create_deal":{
        const id=String(p.id ?? randomUUID());
        await tx.query(
          `INSERT INTO opportunities
           (id,tenant_id,pipeline_id,stage_id,title,value,currency,status,probability,custom_fields)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
          [
            id,tenantId,String(p.pipelineId),String(p.stageId),String(p.title ?? "Opportunity"),
            Number(p.value ?? 0),String(p.currency ?? "USD"),String(p.status ?? "open"),
            Number(p.probability ?? 50),JSON.stringify({sourceContactId:p.contactId,sourceOwnerId:p.userId ?? p.ownerId})
          ]
        );
        return {subject:{entityType:"opportunity",entityId:id},after:{id,...p}};
      }
      case "crm.log_activity":{
        const id=String(p.id ?? randomUUID());
        const subjectId=String(p.contactId ?? p.subjectId ?? "");
        if(!subjectId) throw new Error("activity subject id is required");
        await tx.query(
          `INSERT INTO activities
           (id,tenant_id,subject_type,subject_id,activity_type,title,notes,occurred_at,metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
          [
            id,tenantId,String(p.subjectType ?? "person"),subjectId,String(p.type ?? "note"),
            String(p.title ?? "Activity"),p.notes ?? null,new Date().toISOString(),
            JSON.stringify({sourceOwnerId:p.userId ?? p.ownerId,dealId:p.dealId})
          ]
        );
        return {subject:{entityType:"custom",entityId:id},after:{id,...p}};
      }
      case "tax.emit_event":{
        const id=String(p.clientEntityId ?? p.returnId ?? p.officeId ?? randomUUID());
        return {
          subject:{entityType:"custom",entityId:id},
          after:p,
          data:{taxEventType:p.eventType}
        };
      }
      default:
        throw new Error(`Unsupported command action: ${command.action}`);
    }
  }

  async today(ownerId:string,tenantId?:string):Promise<NextAction[]>{
    const tenant=tenantId ?? this.defaultTenantId;
    if(!tenant) throw new Error("tenantId is required");

    const taskRows=await this.db.query<any>(
      `SELECT * FROM tasks
       WHERE tenant_id=$1 AND owner_actor_id::text=$2
         AND status IN ('open','in_progress','blocked')
       ORDER BY due_at NULLS LAST
       LIMIT 100`,
      [tenant,ownerId]
    );

    const actions:NextAction[]=taskRows.rows.map(row=>({
      id:`task:${row.id}`,
      tenantId:tenant,
      ownerId,
      subject:{entityType:"task",entityId:row.id},
      title:row.title,
      reason:row.status==="blocked" ? "Task is blocked" : "Open task",
      urgency:row.due_at && new Date(row.due_at)<=new Date() ? 1 : 0.6,
      businessValue:Math.min(1,Math.max(0,Number(row.priority ?? 0)/10)),
      risk:row.status==="blocked" ? 0.8 : 0.3,
      confidence:1,
      effort:0.4,
      dueAt:row.due_at?new Date(row.due_at).toISOString():undefined,
      blockers:row.status==="blocked"?["blocked"]:[]
    }));

    const ops=new PostgresOperationalTodayRepository(this.db);
    const [waiting,providers]=await Promise.all([
      ops.waitingWorkflows(ownerId,tenant),
      ops.providerIncidents(ownerId,tenant)
    ]);

    for(const row of waiting){
      actions.push({
        id:`waiting-workflow:${row.runId}`,tenantId:tenant,ownerId,subject:row.subject,
        title:`Automation waiting: ${row.workflowName}`,reason:row.lastError ?? "Waiting workflow",
        urgency:row.retryAt && new Date(row.retryAt)<=new Date()?0.95:0.7,
        businessValue:0.7,risk:Math.min(1,0.45+row.retries*0.1),confidence:1,effort:0.35,
        dueAt:row.retryAt,blockers:[]
      });
    }

    for(const row of providers){
      actions.push({
        id:`provider:${row.id}`,tenantId:tenant,ownerId,subject:row.subject,
        title:`${row.channel.toUpperCase()} provider issue: ${row.providerKey}`,
        reason:row.circuitOpen?"Provider circuit is open":"Provider failures detected",
        urgency:row.circuitOpen?1:0.75,businessValue:0.75,risk:row.circuitOpen?1:0.7,
        confidence:1,effort:0.3,blockers:[]
      });
    }

    return new NextActionEngine().rank(actions);
  }

  async stageWorkflow(
    workflow:Omit<WorkflowDefinition,"version"|"status">,
    tenantId?:string
  ):Promise<WorkflowDefinition>{
    const tenant=tenantId ?? this.defaultTenantId;
    if(!tenant) throw new Error("tenantId is required");
    return new WorkflowVersionService(new PostgresWorkflowRepository(this.db,tenant)).stage(workflow);
  }

  async simulateWorkflow(
    workflowId:string,
    version:number,
    _eventIds:string[],
    tenantId?:string
  ):Promise<unknown>{
    const tenant=tenantId ?? this.defaultTenantId;
    if(!tenant) throw new Error("tenantId is required");
    const workflow=await new PostgresWorkflowRepository(this.db,tenant).get(workflowId,version);
    if(!workflow) throw new Error("Workflow not found");
    return new WorkflowSimulator().simulate(workflow);
  }

  async installExtension(input:Record<string,unknown>,tenantId?:string):Promise<{id:string;version:string}>{
    const id=String(input.id ?? (input.manifest as any)?.id ?? "");
    const version=String(input.version ?? (input.manifest as any)?.version ?? "");
    if(!id || !version) throw new Error("Extension id and version are required");
    await new PostgresExtensionRepository(this.db).install({
      tenantId:tenantId ?? this.defaultTenantId,
      id,version,status:String(input.status ?? "active") as any,
      manifest:(input.manifest as Record<string,unknown>) ?? input,
      installedAt:new Date().toISOString()
    });
    return {id,version};
  }

  async listExtensions(tenantId?:string):Promise<Array<{id:string;version:string;status:string}>>{
    const rows=await new PostgresExtensionRepository(this.db).list(tenantId ?? this.defaultTenantId);
    return rows.map(row=>({id:row.id,version:row.version,status:row.status}));
  }

  async registerWebhook(
    extensionId:string,eventType:string,url:string,tenantId?:string
  ):Promise<{subscriptionId:string}>{
    const subscriptionId=await new PostgresExtensionRepository(this.db).registerWebhook({
      tenantId:tenantId ?? this.defaultTenantId,extensionId,eventType,url
    });
    return {subscriptionId};
  }

  private requireTenant(tenantId?:string):string{
    const tenant=tenantId ?? this.defaultTenantId;
    if(!tenant) throw new Error("tenantId is required");
    return tenant;
  }

  async saveReport(definition:ReportDefinition,tenantId?:string):Promise<void>{
    const tenant=this.requireTenant(tenantId);
    await new PostgresAnalyticsRepository(this.db).saveReport({...definition,tenantId:tenant});
  }

  async listReports(tenantId?:string):Promise<ReportDefinition[]>{
    return new PostgresAnalyticsRepository(this.db).listReports(this.requireTenant(tenantId));
  }

  async saveGoal(goal:Goal,tenantId?:string):Promise<void>{
    const tenant=this.requireTenant(tenantId);
    await new PostgresAnalyticsRepository(this.db).saveGoal({...goal,tenantId:tenant});
  }

  async listGoals(tenantId?:string,scopeType?:string,scopeId?:string):Promise<Goal[]>{
    return new PostgresAnalyticsRepository(this.db).listGoals(
      this.requireTenant(tenantId),scopeType,scopeId
    );
  }

  async metricSeries(input:{
    metricKey:string;from?:string;to?:string;scopeType?:string;scopeId?:string;
  },tenantId?:string){
    return new PostgresAnalyticsRepository(this.db).metricSeries({
      tenantId:this.requireTenant(tenantId),
      ...input
    });
  }

  async saveTaxRequiredDocuments(input:{
    clientEntityId:string;taxYear:number;documents:RequiredTaxDocument[];
  },tenantId?:string):Promise<void>{
    await new PostgresTaxPackRepository(this.db).saveRequiredDocuments({
      tenantId:this.requireTenant(tenantId),...input
    });
  }

  async saveTaxReturn(state:TaxReturnLifecycleState,tenantId?:string):Promise<void>{
    const tenant=this.requireTenant(tenantId);
    await new PostgresTaxPackRepository(this.db).saveReturn({...state,tenantId:tenant});
  }

  async saveTaxSignature(auth:SignatureAuthorization,tenantId?:string):Promise<void>{
    const tenant=this.requireTenant(tenantId);
    await new PostgresTaxPackRepository(this.db).saveSignature({...auth,tenantId:tenant});
  }

  async saveTaxBankProduct(app:BankProductApplication,tenantId?:string):Promise<void>{
    const tenant=this.requireTenant(tenantId);
    await new PostgresTaxPackRepository(this.db).saveBankProduct({...app,tenantId:tenant});
  }

  async saveTaxCredential(status:PreparerCredentialStatus,tenantId?:string):Promise<void>{
    await new PostgresTaxPackRepository(this.db).saveCredential(
      this.requireTenant(tenantId),status
    );
  }

  async createTaxPortalRequest(request:ClientPortalRequest,tenantId?:string):Promise<void>{
    const tenant=this.requireTenant(tenantId);
    await new PostgresTaxPackRepository(this.db).createPortalRequest({...request,tenantId:tenant});
  }

  async listActionReceipts(input:{
    correlationId?:string;actorId?:string;action?:string;status?:ActionReceiptStatus;limit?:number;
  },tenantId?:string):Promise<ActionReceipt[]>{
    return new PostgresActionReceiptRepository(this.db).list({
      tenantId:this.requireTenant(tenantId),...input
    });
  }

  async truthConsole(input:{
    correlationId?:string;actorId?:string;action?:string;status?:ActionReceiptStatus;limit?:number;
  },tenantId?:string){
    const receipts=await this.listActionReceipts(input,tenantId);
    return new TruthConsoleProjector().project(receipts);
  }

  async truthSummary(input:{
    correlationId?:string;actorId?:string;action?:string;status?:ActionReceiptStatus;limit?:number;
  },tenantId?:string){
    const receipts=await this.listActionReceipts(input,tenantId);
    return new TruthConsoleProjector().summary(receipts);
  }
}
