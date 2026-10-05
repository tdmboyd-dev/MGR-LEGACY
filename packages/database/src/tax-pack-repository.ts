import type {
  BankProductApplication,
  ClientPortalRequest,
  RequiredTaxDocument,
  SignatureAuthorization,
  TaxReturnLifecycleState,
  PreparerCredentialStatus
} from "@mgr/legacy-tax-pack";
import type { SqlExecutor } from "./sql.js";

export class PostgresTaxPackRepository {
  constructor(private readonly db:SqlExecutor){}

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
    await this.db.query(
      `INSERT INTO signature_authorizations
       (id,tenant_id,client_entity_id,return_id,form_type,status,signed_at,signer_id,evidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
       ON CONFLICT (id)
       DO UPDATE SET status=EXCLUDED.status,signed_at=EXCLUDED.signed_at,
       signer_id=EXCLUDED.signer_id,evidence=EXCLUDED.evidence,updated_at=now()`,
      [
        auth.id,auth.tenantId,auth.clientEntityId,auth.returnId,auth.formType,auth.status,
        auth.signedAt ?? null,auth.signerId ?? null,JSON.stringify(auth.evidence)
      ]
    );
  }

  async saveBankProduct(app:BankProductApplication):Promise<void>{
    await this.db.query(
      `INSERT INTO bank_product_applications
       (id,tenant_id,client_entity_id,return_id,provider_key,product_type,status,expected_refund,advance_amount,fees,funded_amount,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id)
       DO UPDATE SET status=EXCLUDED.status,expected_refund=EXCLUDED.expected_refund,
       advance_amount=EXCLUDED.advance_amount,fees=EXCLUDED.fees,funded_amount=EXCLUDED.funded_amount,
       updated_at=EXCLUDED.updated_at`,
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
