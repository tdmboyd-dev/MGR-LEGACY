export type ControlEventType =
  | "approval.requested"
  | "approval.resolved"
  | "workflow.started"
  | "workflow.waiting"
  | "workflow.failed"
  | "action.receipt"
  | "provider.incident";

export interface RealtimeControlEvent {
  eventId:string;
  tenantId:string;
  type:ControlEventType;
  at:string;
  correlationId?:string;
  payload:Record<string,unknown>;
}

export interface RealtimeControlBus {
  publish(event:RealtimeControlEvent):Promise<void>;
  subscribe(tenantId:string,handler:(event:RealtimeControlEvent)=>Promise<void>):Promise<()=>void>;
}

export type MobileControlAction="approve"|"deny"|"pause"|"resume"|"cancel"|"inspect";

export interface MobileControlCommand {
  commandId:string;
  tenantId:string;
  actorId:string;
  channel:"mobile"|"telegram";
  action:MobileControlAction;
  targetType:string;
  targetId:string;
  reason?:string;
  issuedAt:string;
}

export class MobileControlGuard {
  validate(command:MobileControlCommand):string[]{
    const errors:string[]=[];
    if(!command.actorId) errors.push("Actor is required");
    if(!command.targetId) errors.push("Target is required");
    if(command.action==="deny" && !command.reason) errors.push("Denial reason is required");
    return errors;
  }
}
