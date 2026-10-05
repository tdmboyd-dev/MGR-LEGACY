export type TaxFactReviewStatus = "unreviewed" | "accepted" | "corrected" | "rejected";

export interface TaxFactSource {
  documentId:string;
  page?:number;
  bbox?:{x:number;y:number;width:number;height:number};
  sourceField?:string;
}

export interface TaxFact {
  id:string;
  tenantId:string;
  clientEntityId:string;
  taxYear:number;
  formType:string;
  canonicalField:string;
  value:unknown;
  confidence:number;
  source:TaxFactSource;
  extraction:{
    provider:string;
    model?:string;
    version?:string;
    observedAt:string;
  };
  reviewStatus:TaxFactReviewStatus;
  reviewedBy?:string;
  reviewedAt?:string;
  originalValue?:unknown;
}

export interface TaxFactCandidate extends Omit<TaxFact,"reviewStatus"|"reviewedBy"|"reviewedAt"> {}

export interface TaxFactPolicy {
  autoAcceptThreshold:number;
  mandatoryReviewFields:string[];
}

export interface TaxFactPromotionResult {
  accepted:TaxFact[];
  reviewQueue:TaxFact[];
}

export class TaxFactGraph {
  private readonly facts=new Map<string,TaxFact>();

  constructor(private readonly policy:TaxFactPolicy={
    autoAcceptThreshold:0.995,
    mandatoryReviewFields:[]
  }){}

  ingest(candidates:TaxFactCandidate[]):TaxFactPromotionResult{
    const accepted:TaxFact[]=[];
    const reviewQueue:TaxFact[]=[];
    const mandatory=new Set(this.policy.mandatoryReviewFields);

    for(const candidate of candidates){
      if(candidate.confidence<0 || candidate.confidence>1) throw new Error("Tax fact confidence must be between 0 and 1");
      const reviewStatus:TaxFactReviewStatus=
        candidate.confidence>=this.policy.autoAcceptThreshold && !mandatory.has(candidate.canonicalField)
          ? "accepted"
          : "unreviewed";
      const fact:TaxFact={...structuredClone(candidate),reviewStatus};
      this.facts.set(fact.id,fact);
      (reviewStatus==="accepted"?accepted:reviewQueue).push(structuredClone(fact));
    }
    return {accepted,reviewQueue};
  }

  get(id:string):TaxFact|null{
    const fact=this.facts.get(id);
    return fact?structuredClone(fact):null;
  }

  listForClient(tenantId:string,clientEntityId:string,taxYear:number):TaxFact[]{
    return [...this.facts.values()]
      .filter(f=>f.tenantId===tenantId && f.clientEntityId===clientEntityId && f.taxYear===taxYear)
      .map(f=>structuredClone(f));
  }

  review(input:{factId:string;reviewerId:string;decision:"accept"|"correct"|"reject";correctedValue?:unknown;at?:string}):TaxFact{
    const current=this.facts.get(input.factId);
    if(!current) throw new Error(`Tax fact not found: ${input.factId}`);
    const at=input.at ?? new Date().toISOString();
    let updated:TaxFact;

    if(input.decision==="correct"){
      if(input.correctedValue===undefined) throw new Error("correctedValue is required for a correction");
      updated={
        ...current,
        originalValue:current.originalValue ?? structuredClone(current.value),
        value:structuredClone(input.correctedValue),
        reviewStatus:"corrected",
        reviewedBy:input.reviewerId,
        reviewedAt:at
      };
    }else{
      updated={
        ...current,
        reviewStatus:input.decision==="accept"?"accepted":"rejected",
        reviewedBy:input.reviewerId,
        reviewedAt:at
      };
    }
    this.facts.set(updated.id,updated);
    return structuredClone(updated);
  }

  assertReadyForPreparation(tenantId:string,clientEntityId:string,taxYear:number):void{
    const facts=this.listForClient(tenantId,clientEntityId,taxYear);
    const unresolved=facts.filter(f=>f.reviewStatus==="unreviewed");
    if(unresolved.length) throw new Error(`Tax facts require review: ${unresolved.map(f=>f.canonicalField).join(", ")}`);
    const rejected=facts.filter(f=>f.reviewStatus==="rejected");
    if(rejected.length) throw new Error(`Rejected tax facts must be resolved: ${rejected.map(f=>f.canonicalField).join(", ")}`);
  }
}

export interface FilingApproval {
  returnId:string;
  preparerId:string;
  approvedAt:string;
  evidenceReceiptId?:string;
}

export class FilingApprovalGate {
  private readonly approvals=new Map<string,FilingApproval>();

  approve(input:FilingApproval):FilingApproval{
    if(!input.preparerId) throw new Error("preparerId is required");
    const approval=structuredClone(input);
    this.approvals.set(input.returnId,approval);
    return structuredClone(approval);
  }

  assertApproved(returnId:string):FilingApproval{
    const approval=this.approvals.get(returnId);
    if(!approval) throw new Error("Explicit preparer approval is required before filing");
    return structuredClone(approval);
  }
}
