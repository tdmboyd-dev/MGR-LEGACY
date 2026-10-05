import type { TaxClientLifecycle } from "@mgr/legacy-tax-pack";

export interface EliteHubClientLifecycleRow {
  tenantId:string;
  clientId:string;
  taxYear:number;
  stage:
    | "New Lead"
    | "Contacted"
    | "Intake Scheduled"
    | "Documents Received"
    | "In Preparation"
    | "In Review"
    | "Ready for Signature"
    | "Filed"
    | "Accepted"
    | "Paid Out";
  officeId?:string|null;
  preparerId?:string|null;
  missingDocuments?:string[]|null;
  signatureComplete?:boolean|null;
  returnStatus?:string|null;
  bankProductStatus?:string|null;
  updatedAt:Date|string;
}

const stageMap:Record<EliteHubClientLifecycleRow["stage"],TaxClientLifecycle["stage"]>={
  "New Lead":"new_lead",
  "Contacted":"contacted",
  "Intake Scheduled":"intake_scheduled",
  "Documents Received":"documents_received",
  "In Preparation":"in_preparation",
  "In Review":"in_review",
  "Ready for Signature":"ready_for_signature",
  "Filed":"filed",
  "Accepted":"accepted",
  "Paid Out":"paid_out"
};

export function mapEliteHubLifecycle(row:EliteHubClientLifecycleRow):TaxClientLifecycle {
  return {
    tenantId:row.tenantId,
    clientEntityId:row.clientId,
    taxYear:row.taxYear,
    stage:stageMap[row.stage],
    assignedOfficeId:row.officeId ?? undefined,
    assignedPreparerId:row.preparerId ?? undefined,
    missingDocuments:row.missingDocuments ?? [],
    signatureComplete:Boolean(row.signatureComplete),
    returnStatus:row.returnStatus ?? undefined,
    bankProductStatus:row.bankProductStatus ?? undefined,
    updatedAt:new Date(row.updatedAt).toISOString()
  };
}
