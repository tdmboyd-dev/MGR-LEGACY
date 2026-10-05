export type TaxEventType=
  | "tax.client.stage_changed"
  | "tax.document.requested"
  | "tax.document.received"
  | "tax.return.stage_changed"
  | "tax.signature.sent"
  | "tax.signature.signed"
  | "tax.bank_product.stage_changed"
  | "tax.funding.reconciled"
  | "tax.credential.issue_detected";

export interface TaxDomainEvent {
  eventType:TaxEventType;
  tenantId:string;
  clientEntityId?:string;
  officeId?:string;
  preparerId?:string;
  taxYear?:number;
  data:Record<string,unknown>;
  occurredAt:string;
}

export class TaxEventFactory {
  create(
    eventType:TaxEventType,
    scope:Omit<TaxDomainEvent,"eventType"|"occurredAt"|"data">,
    data:Record<string,unknown>,
    now=new Date()
  ):TaxDomainEvent{
    return {...scope,eventType,data,occurredAt:now.toISOString()};
  }
}
