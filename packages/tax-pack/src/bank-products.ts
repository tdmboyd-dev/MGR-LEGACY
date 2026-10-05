export type BankProductStatus=
  | "draft"
  | "eligible"
  | "ineligible"
  | "submitted"
  | "under_review"
  | "approved"
  | "funded"
  | "denied"
  | "cancelled"
  | "error";

export interface BankProductApplication {
  id:string;
  tenantId:string;
  clientEntityId:string;
  returnId:string;
  providerKey:string;
  productType:string;
  status:BankProductStatus;
  expectedRefund:number;
  advanceAmount?:number;
  fees:number;
  fundedAmount?:number;
  updatedAt:string;
}

export class BankProductLifecycleEngine {
  allowed(from:BankProductStatus,to:BankProductStatus):boolean{
    const map:Record<BankProductStatus,BankProductStatus[]>={
      draft:["eligible","ineligible","cancelled"],
      eligible:["submitted","cancelled"],
      ineligible:["cancelled"],
      submitted:["under_review","approved","denied","error","cancelled"],
      under_review:["approved","denied","error","cancelled"],
      approved:["funded","cancelled","error"],
      funded:[],
      denied:[],
      cancelled:[],
      error:["submitted","cancelled"]
    };
    return map[from].includes(to);
  }

  transition(app:BankProductApplication,to:BankProductStatus,now=new Date()):BankProductApplication{
    if(!this.allowed(app.status,to)) throw new Error(`Invalid bank-product transition ${app.status} -> ${to}`);
    return {...app,status:to,updatedAt:now.toISOString()};
  }
}
