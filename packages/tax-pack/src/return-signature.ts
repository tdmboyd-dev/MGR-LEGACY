export type TaxReturnStage=
  | "draft"
  | "in_preparation"
  | "review"
  | "ready_for_signature"
  | "signed"
  | "submitted"
  | "accepted"
  | "rejected"
  | "amended";

export interface TaxReturnLifecycleState {
  tenantId:string;
  clientEntityId:string;
  taxYear:number;
  returnId:string;
  stage:TaxReturnStage;
  lastRejectCode?:string;
  submittedAt?:string;
  acceptedAt?:string;
  updatedAt:string;
}

export class TaxReturnLifecycleEngine {
  canTransition(from:TaxReturnStage,to:TaxReturnStage):boolean{
    const allowed:Record<TaxReturnStage,TaxReturnStage[]>={
      draft:["in_preparation"],
      in_preparation:["review","draft"],
      review:["in_preparation","ready_for_signature"],
      ready_for_signature:["review","signed"],
      signed:["submitted"],
      submitted:["accepted","rejected"],
      accepted:["amended"],
      rejected:["in_preparation","submitted"],
      amended:["review","ready_for_signature"]
    };
    return allowed[from].includes(to);
  }

  transition(state:TaxReturnLifecycleState,to:TaxReturnStage,now=new Date()):TaxReturnLifecycleState{
    if(!this.canTransition(state.stage,to)) throw new Error(`Invalid tax return transition ${state.stage} -> ${to}`);
    return {
      ...state,
      stage:to,
      submittedAt:to==="submitted" ? now.toISOString() : state.submittedAt,
      acceptedAt:to==="accepted" ? now.toISOString() : state.acceptedAt,
      updatedAt:now.toISOString()
    };
  }
}

export interface SignatureAuthorization {
  id:string;
  tenantId:string;
  clientEntityId:string;
  returnId:string;
  formType:"8879"|"8878"|"custom";
  status:"draft"|"sent"|"viewed"|"signed"|"declined"|"expired";
  signedAt?:string;
  signerId?:string;
  evidence:Record<string,unknown>;
}

export class SignatureEngine {
  sign(auth:SignatureAuthorization,signerId:string,evidence:Record<string,unknown>,now=new Date()):SignatureAuthorization{
    if(!["sent","viewed"].includes(auth.status)) throw new Error("Signature request is not signable");
    return {...auth,status:"signed",signerId,signedAt:now.toISOString(),evidence:{...auth.evidence,...evidence}};
  }
}
