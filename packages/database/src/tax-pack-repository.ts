import { tenantCheckedQuery } from "./tenant-safe-query.js";
import type {
  BankProductApplication,
  ClientPortalRequest,
  RequiredTaxDocument,
  SignatureAuthorization,
  TaxReturnLifecycleState,
  PreparerCredentialStatus,
  TaxFact,
  FilingApproval
} from "@mgr/legacy-tax-pack";
import type { SqlDatabase } from "./sql.js";
import { inTransaction } from "./transaction.js";

export class PostgresTaxPackRepository {
  constructor(private readonly db:SqlDatabase){}

  async saveRequiredDocuments(input:{
    tenantId:string;clientEntityId:string;taxYear:number;documents:RequiredTaxDocument[];
  }):Promise<void>{
    for(const doc of input.documents){
      await this.db.query(
        `INSERT INTO tax_required_documents
         (tenant_id,client_entity_id,tax_year,document_code,label,required,received,requested_at,received_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (tenant_id,client_entity_id,tax_year,document_code)
         DO UPDATE SET label=EXCLUDED.label,required=EXCLUDED.required,received=EXCLUDED.received,
         requested_at=EXCLUDED.requested_at,received_at=EXCLUDED.received_at`,
        [
          input.tenantId,input.clientEntityId,input.taxYear,doc.code,doc.label,doc.required,
          doc.received,doc.requestedAt ?? null,doc.receivedAt ?? null
        ]
      );
    }
  }

  async saveReturn(state:TaxReturnLifecycleState):Promise<void>{
    await this.db.query(
      `INSERT INTO tax_return_lifecycle
       (tenant_id,client_entity_id,tax_year,return_id,stage,last_reject_code,submitted_at,accepted_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (tenant_id,return_id)
       DO UPDATE SET stage=EXCLUDED.stage,last_reject_code=EXCLUDED.last_reject_code,
       submitted_at=EXCLUDED.submitted_at,accepted_at=EXCLUDED.accepted_at,updated_at=EXCLUDED.updated_at`,
      [
        state.tenantId,state.clientEntityId,state.taxYear,state.returnId,state.stage,
        state.lastRejectCode ?? null,state.submittedAt ?? null,state.acceptedAt ?? null,state.updatedAt
      ]
    );
  }

  async saveSignature(auth:SignatureAuthorization):Promise<void>{
    await tenantCheckedQuery(this.db,
      `INSERT INTO signature_authorizations
       (id,tenant_id,client_entity_id,return_id,form_type,status,signed_at,signer_id,evidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
       ON CONFLICT (id)
       DO UPDATE SET status=EXCLUDED.status,signed_at=EXCLUDED.signed_at,
       signer_id=EXCLUDED.signer_id,evidence=EXCLUDED.evidence,updated_at=now()
       WHERE signature_authorizations.tenant_id=EXCLUDED.tenant_id`,
      [
        auth.id,auth.tenantId,auth.clientEntityId,auth.returnId,auth.formType,auth.status,
        auth.signedAt ?? null,auth.signerId ?? null,JSON.stringify(auth.evidence)
      ]
    );
  }

  async saveBankProduct(app:BankProductApplication):Promise<void>{
    await tenantCheckedQuery(this.db,
      `INSERT INTO bank_product_applications
       (id,tenant_id,client_entity_id,return_id,provider_key,product_type,status,expected_refund,advance_amount,fees,funded_amount,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id)
       DO UPDATE SET status=EXCLUDED.status,expected_refund=EXCLUDED.expected_refund,
       advance_amount=EXCLUDED.advance_amount,fees=EXCLUDED.fees,funded_amount=EXCLUDED.funded_amount,
       updated_at=EXCLUDED.updated_at
       WHERE bank_product_applications.tenant_id=EXCLUDED.tenant_id`,
      [
        app.id,app.tenantId,app.clientEntityId,app.returnId,app.providerKey,app.productType,
        app.status,app.expectedRefund,app.advanceAmount ?? null,app.fees,app.fundedAmount ?? null,app.updatedAt
      ]
    );
  }

  async saveCredential(tenantId:string,status:PreparerCredentialStatus):Promise<void>{
    await this.db.query(
      `INSERT INTO tax_credential_status
       (tenant_id,preparer_id,ptin_valid,efin_linked,ce_complete,expires_at,issues)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (tenant_id,preparer_id)
       DO UPDATE SET ptin_valid=EXCLUDED.ptin_valid,efin_linked=EXCLUDED.efin_linked,
       ce_complete=EXCLUDED.ce_complete,expires_at=EXCLUDED.expires_at,issues=EXCLUDED.issues,updated_at=now()`,
      [
        tenantId,status.preparerId,status.ptinValid,status.efinLinked,status.ceComplete,
        status.expiresAt ?? null,status.issues
      ]
    );
  }

  async saveTaxFact(fact:TaxFact):Promise<void>{
    await tenantCheckedQuery(this.db,
      `INSERT INTO tax_facts
       (id,tenant_id,client_entity_id,tax_year,form_type,canonical_field,value,confidence,source,extraction,
        review_status,reviewed_by,reviewed_at,original_value)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9::jsonb,$10::jsonb,$11,$12,$13,$14::jsonb)
       ON CONFLICT (id)
       DO UPDATE SET value=EXCLUDED.value,confidence=EXCLUDED.confidence,source=EXCLUDED.source,
       extraction=EXCLUDED.extraction,review_status=EXCLUDED.review_status,reviewed_by=EXCLUDED.reviewed_by,
       reviewed_at=EXCLUDED.reviewed_at,original_value=EXCLUDED.original_value,updated_at=now()
       WHERE tax_facts.tenant_id=EXCLUDED.tenant_id`,
      [
        fact.id,fact.tenantId,fact.clientEntityId,fact.taxYear,fact.formType,fact.canonicalField,
        JSON.stringify(fact.value),fact.confidence,JSON.stringify(fact.source),JSON.stringify(fact.extraction),
        fact.reviewStatus,fact.reviewedBy ?? null,fact.reviewedAt ?? null,
        fact.originalValue===undefined?null:JSON.stringify(fact.originalValue)
      ]
    );
  }

  async listTaxFacts(input:{tenantId:string;clientEntityId:string;taxYear:number}):Promise<TaxFact[]>{
    const result=await this.db.query<any>(
      `SELECT * FROM tax_facts
       WHERE tenant_id=$1 AND client_entity_id=$2 AND tax_year=$3
       ORDER BY form_type,canonical_field,id`,
      [input.tenantId,input.clientEntityId,input.taxYear]
    );
    return result.rows.map(row=>this.factFromRow(row));
  }

  private factFromRow(row:any):TaxFact{
    return {
      id:row.id,
      tenantId:row.tenant_id,
      clientEntityId:row.client_entity_id,
      taxYear:Number(row.tax_year),
      formType:row.form_type,
      canonicalField:row.canonical_field,
      value:row.value,
      confidence:Number(row.confidence),
      source:row.source,
      extraction:row.extraction,
      reviewStatus:row.review_status,
      ...(row.reviewed_by?{reviewedBy:row.reviewed_by}:{}),
      ...(row.reviewed_at?{reviewedAt:new Date(row.reviewed_at).toISOString()}:{}),
      ...(row.original_value!==null?{originalValue:row.original_value}:{})
    };
  }

  async reviewTaxFact(input:{
    tenantId:string;factId:string;reviewerId:string;decision:"accept"|"correct"|"reject";correctedValue?:unknown;reviewedAt?:string;
  }):Promise<TaxFact>{
    if(!['accept','correct','reject'].includes(input.decision))throw new Error("Invalid tax review decision");
    if(input.decision==='correct'&&input.correctedValue===undefined)throw new Error("correctedValue is required for a correction");
    return inTransaction(this.db,async tx=>{
      const current=await tx.query<any>("SELECT * FROM tax_facts WHERE tenant_id=$1 AND id=$2 FOR UPDATE",[input.tenantId,input.factId]);
      const row=current.rows[0];if(!row)throw new Error("Tax fact not found");
      const reviewedAt=input.reviewedAt ?? new Date().toISOString();
      const nextValue=input.decision==='correct'?input.correctedValue:row.value;
      const nextStatus=input.decision==='accept'?'accepted':input.decision==='correct'?'corrected':'rejected';
      const result=await tx.query<any>(
        `UPDATE tax_facts SET value=$3::jsonb,review_status=$4,reviewed_by=$5,reviewed_at=$6,
         original_value=CASE WHEN $7 THEN COALESCE(original_value,value) ELSE original_value END,updated_at=now()
         WHERE tenant_id=$1 AND id=$2 RETURNING *`,
        [input.tenantId,input.factId,JSON.stringify(nextValue),nextStatus,input.reviewerId,reviewedAt,input.decision==='correct']
      );
      await tx.query(
        `INSERT INTO tax_fact_review_events (tenant_id,fact_id,reviewer_id,decision,before_value,after_value,reviewed_at)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)`,
        [input.tenantId,input.factId,input.reviewerId,input.decision,JSON.stringify(row.value),JSON.stringify(nextValue),reviewedAt]
      );
      if(result.rowCount!==1)throw new Error("Tax fact not found after review");
      return this.factFromRow(result.rows[0]);
    });
  }

  async saveFilingApproval(tenantId:string,approval:FilingApproval):Promise<void>{
    await this.db.query(
      `INSERT INTO tax_filing_approvals
       (tenant_id,return_id,preparer_id,approved_at,evidence_receipt_id,metadata)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)
       ON CONFLICT (tenant_id,return_id)
       DO UPDATE SET preparer_id=EXCLUDED.preparer_id,approved_at=EXCLUDED.approved_at,
       evidence_receipt_id=EXCLUDED.evidence_receipt_id,metadata=EXCLUDED.metadata`,
      [
        tenantId,approval.returnId,approval.preparerId,approval.approvedAt,
        approval.evidenceReceiptId ?? null,JSON.stringify({})
      ]
    );
  }

  async getFilingApproval(tenantId:string,returnId:string):Promise<FilingApproval|null>{
    const result=await this.db.query<any>(
      "SELECT * FROM tax_filing_approvals WHERE tenant_id=$1 AND return_id=$2 LIMIT 1",
      [tenantId,returnId]
    );
    const row=result.rows[0];
    if(!row) return null;
    return {
      returnId:row.return_id,
      preparerId:row.preparer_id,
      approvedAt:new Date(row.approved_at).toISOString(),
      ...(row.evidence_receipt_id?{evidenceReceiptId:row.evidence_receipt_id}:{})
    };
  }

  async createPortalRequest(request:ClientPortalRequest):Promise<void>{
    await this.db.query(
      `INSERT INTO client_portal_requests
       (id,tenant_id,client_entity_id,request_type,status,title,due_at,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
      [
        request.id,request.tenantId,request.clientEntityId,request.type,request.status,
        request.title,request.dueAt ?? null,JSON.stringify(request.metadata)
      ]
    );
  }
}
