import { randomUUID } from "node:crypto";
import type { Command, LegacyEvent } from "@mgr/legacy-contracts";
import type { PolicyContext, PolicyEngine } from "./policy.js";

export interface IdempotencyPort {
  get(tenantId:string, key:string): Promise<{ response?: unknown } | null>;
  reserve(tenantId:string, key:string, commandId:string): Promise<boolean>;
  complete(tenantId:string, key:string, response:unknown): Promise<void>;
}

export interface AuditPort {
  append(entry:{
    tenantId:string; actorType:string; actorId:string; action:string; resourceType:string;
    resourceId?:string; decision:string; reason?:string; correlationId:string;
    evidence?:Record<string,unknown>;
  }): Promise<void>;
}

export interface EventPort {
  append(event:LegacyEvent): Promise<void>;
}

export interface OutboxPort {
  enqueue(event:LegacyEvent, topic?:string): Promise<void>;
}

export interface CommandTransaction {
  idempotency: IdempotencyPort;
  audit: AuditPort;
  events: EventPort;
  outbox: OutboxPort;
}

export interface UnitOfWorkPort {
  run<T>(fn:(tx:CommandTransaction)=>Promise<T>): Promise<T>;
}

export interface TransactionalCommandHandler {
  action:string;
  resourceType:string;
  handle(command:Command, tx:CommandTransaction):Promise<{
    subject:LegacyEvent["subject"];
    before?:unknown;
    after?:unknown;
    data?:Record<string,unknown>;
  }>;
}

export class TransactionalCommandService {
  private readonly handlers = new Map<string,TransactionalCommandHandler>();

  constructor(
    private readonly policy:PolicyEngine,
    private readonly unitOfWork:UnitOfWorkPort
  ) {}

  register(handler:TransactionalCommandHandler):void {
    if(this.handlers.has(handler.action)) throw new Error(`Handler already registered: ${handler.action}`);
    this.handlers.set(handler.action,handler);
  }

  async execute(
    command:Command,
    context:Omit<PolicyContext,"action"|"resourceType">
  ):Promise<{accepted:boolean;approvalRequired:boolean;event?:LegacyEvent;reason?:string;replayed?:boolean}> {
    const handler=this.handlers.get(command.action);
    if(!handler) throw new Error(`No handler registered for ${command.action}`);

    return this.unitOfWork.run(async(tx)=>{
      const existing=await tx.idempotency.get(command.scope.tenantId,command.idempotencyKey);
      if(existing?.response) {
        return { ...(existing.response as object), replayed:true } as {
          accepted:boolean;approvalRequired:boolean;event?:LegacyEvent;reason?:string;replayed?:boolean
        };
      }

      const reserved=await tx.idempotency.reserve(command.scope.tenantId,command.idempotencyKey,command.commandId);
      if(!reserved) {
        const retry=await tx.idempotency.get(command.scope.tenantId,command.idempotencyKey);
        if(retry?.response) return { ...(retry.response as object), replayed:true } as any;
        throw new Error("Command with this idempotency key is already in progress");
      }

      const decision=this.policy.evaluate({
        ...context,
        action:command.action,
        resourceType:handler.resourceType
      });

      if(!decision.allowed) {
        const response={accepted:false,approvalRequired:false,reason:decision.reason};
        await tx.audit.append({
          tenantId:command.scope.tenantId,
          actorType:command.actor.actorType,
          actorId:command.actor.actorId,
          action:command.action,
          resourceType:handler.resourceType,
          resourceId:command.target?.entityId,
          decision:"denied",
          reason:decision.reason,
          correlationId:command.correlationId
        });
        await tx.idempotency.complete(command.scope.tenantId,command.idempotencyKey,response);
        return response;
      }

      if(decision.approval.required) {
        const response={accepted:false,approvalRequired:true,reason:decision.approval.reason};
        await tx.audit.append({
          tenantId:command.scope.tenantId,
          actorType:command.actor.actorType,
          actorId:command.actor.actorId,
          action:command.action,
          resourceType:handler.resourceType,
          resourceId:command.target?.entityId,
          decision:"approval_required",
          reason:decision.approval.reason,
          correlationId:command.correlationId
        });
        await tx.idempotency.complete(command.scope.tenantId,command.idempotencyKey,response);
        return response;
      }

      const mutation=await handler.handle(command,tx);
      const event:LegacyEvent={
        eventId:randomUUID(),
        eventType:`${handler.resourceType}.${command.action}`,
        eventVersion:1,
        occurredAt:new Date().toISOString(),
        actor:command.actor,
        scope:command.scope,
        subject:mutation.subject,
        source:"transactional_command",
        correlationId:command.correlationId,
        idempotencyKey:command.idempotencyKey,
        before:mutation.before,
        after:mutation.after,
        data:mutation.data ?? {},
        evidence:{commandId:command.commandId}
      };

      await tx.events.append(event);
      await tx.outbox.enqueue(event);
      await tx.audit.append({
        tenantId:command.scope.tenantId,
        actorType:command.actor.actorType,
        actorId:command.actor.actorId,
        action:command.action,
        resourceType:handler.resourceType,
        resourceId:mutation.subject.entityId,
        decision:"allowed",
        correlationId:command.correlationId,
        evidence:{eventId:event.eventId}
      });

      const response={accepted:true,approvalRequired:false,event};
      await tx.idempotency.complete(command.scope.tenantId,command.idempotencyKey,response);
      return response;
    });
  }
}
