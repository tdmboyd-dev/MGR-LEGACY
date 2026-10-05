export interface RequiredTaxDocument {
  code:string;
  label:string;
  required:boolean;
  received:boolean;
  requestedAt?:string;
  receivedAt?:string;
}

export interface DocumentChaseState {
  tenantId:string;
  clientEntityId:string;
  taxYear:number;
  documents:RequiredTaxDocument[];
}

export class DocumentChaseEngine {
  missing(state:DocumentChaseState):RequiredTaxDocument[]{
    return state.documents.filter(doc=>doc.required && !doc.received);
  }

  nextActions(state:DocumentChaseState):string[]{
    return this.missing(state).map(doc=>`Request missing document: ${doc.label}`);
  }

  complete(state:DocumentChaseState):boolean{
    return this.missing(state).length===0;
  }
}
