import type { ActionReceipt, ActionReceiptStatus } from "./action-receipts.js";

export interface TruthConsoleRow {
  receiptId:string;
  at:string;
  actorId:string;
  action:string;
  status:ActionReceiptStatus;
  executionMode:string;
  policyDecision:string;
  approvalCount:number;
  providerKey?:string;
  cost?:number;
  error?:string;
  evidenceKeys:string[];
}

export class TruthConsoleProjector {
  project(receipts:ActionReceipt[]):TruthConsoleRow[]{
    return [...receipts]
      .sort((a,b)=>b.startedAt.localeCompare(a.startedAt))
      .map(receipt=>({
        receiptId:receipt.receiptId,
        at:receipt.completedAt ?? receipt.startedAt,
        actorId:receipt.actor.actorId,
        action:receipt.action,
        status:receipt.status,
        executionMode:receipt.executionMode,
        policyDecision:receipt.policyDecision,
        approvalCount:receipt.approvals.length,
        providerKey:receipt.provider?.providerKey,
        cost:receipt.provider?.cost,
        error:receipt.error,
        evidenceKeys:Object.keys(receipt.evidence).sort()
      }));
  }

  summary(receipts:ActionReceipt[]):{
    total:number;
    succeeded:number;
    failed:number;
    blocked:number;
    approvalRate:number;
    totalProviderCost:number;
  }{
    const total=receipts.length;
    const approved=receipts.filter(r=>r.approvals.some(a=>a.decision==="approved")).length;
    return {
      total,
      succeeded:receipts.filter(r=>r.status==="succeeded").length,
      failed:receipts.filter(r=>r.status==="failed").length,
      blocked:receipts.filter(r=>r.status==="blocked").length,
      approvalRate:total===0?0:approved/total,
      totalProviderCost:receipts.reduce((sum,r)=>sum+(r.provider?.cost ?? 0),0)
    };
  }
}
