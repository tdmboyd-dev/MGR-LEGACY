import type { Actor, EntityRef, TenantScope } from "@mgr/legacy-contracts";

export type ExecutionMode = "observe" | "recommend" | "draft" | "ask" | "limited" | "autonomous";
export type ActionReceiptStatus = "planned" | "simulated" | "approved" | "executing" | "succeeded" | "failed" | "blocked" | "rolled_back";

export interface ApprovalEvidence {
  approvalId:string;
  approverId:string;
  decision:"approved"|"denied";
  reason?:string;
  decidedAt:string;
}

export interface ProviderEvidence {
  providerKey?:string;
  providerMessageId?:string;
  externalRequestId?:string;
  latencyMs?:number;
  cost?:number;
  currency?:string;
}

export interface ActionReceipt {
  receiptId:string;
  tenantId:string;
  correlationId:string;
  causationId?:string;
  actor:Actor;
  scope:TenantScope;
  action:string;
  target?:EntityRef;
  executionMode:ExecutionMode;
  status:ActionReceiptStatus;
  argumentSummary:Record<string,unknown>;
  policyDecision:string;
  policyReason?:string;
  approvals:ApprovalEvidence[];
  evidence:Record<string,unknown>;
  provider?:ProviderEvidence;
  startedAt:string;
  completedAt?:string;
  outcome?:Record<string,unknown>;
  error?:string;
  reversible:boolean;
  rollbackReceiptId?:string;
}

export interface ActionReceiptStore {
  append(receipt:ActionReceipt):Promise<void>;
  get(tenantId:string,receiptId:string):Promise<ActionReceipt|null>;
  list(input:{
    tenantId:string;
    correlationId?:string;
    actorId?:string;
    action?:string;
    status?:ActionReceiptStatus;
    limit?:number;
  }):Promise<ActionReceipt[]>;
}

export class ActionReceiptService {
  constructor(private readonly store:ActionReceiptStore){}

  record(receipt:ActionReceipt):Promise<void>{
    return this.store.append(structuredClone(receipt));
  }

  async complete(
    receipt:ActionReceipt,
    status:Extract<ActionReceiptStatus,"succeeded"|"failed"|"blocked"|"rolled_back">,
    input:{outcome?:Record<string,unknown>;error?:string;provider?:ProviderEvidence},
    now=new Date()
  ):Promise<ActionReceipt>{
    const completed:ActionReceipt={
      ...receipt,
      status,
      completedAt:now.toISOString(),
      outcome:input.outcome,
      error:input.error,
      provider:input.provider ?? receipt.provider
    };
    await this.store.append(completed);
    return completed;
  }
}
