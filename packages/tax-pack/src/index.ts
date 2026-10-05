export type TaxHierarchyRole = "service_bureau" | "child_bureau" | "ero_office" | "preparer";

export interface TaxHierarchyNode {
  id: string;
  tenantId: string;
  role: TaxHierarchyRole;
  parentId?: string;
  displayName: string;
  active: boolean;
}

export type TaxClientStage =
  | "new_lead"
  | "contacted"
  | "intake_scheduled"
  | "documents_received"
  | "in_preparation"
  | "in_review"
  | "ready_for_signature"
  | "filed"
  | "accepted"
  | "paid_out";

export interface TaxClientLifecycle {
  tenantId: string;
  clientEntityId: string;
  taxYear: number;
  stage: TaxClientStage;
  assignedOfficeId?: string;
  assignedPreparerId?: string;
  missingDocuments: string[];
  signatureComplete: boolean;
  returnStatus?: string;
  bankProductStatus?: string;
  updatedAt: string;
}

export interface OfficeReadinessSignals {
  credentialsReady: boolean;
  bankProductsConfigured: boolean;
  usersInvited: boolean;
  workflowsEnabled: boolean;
  trainingComplete: boolean;
  consentTemplatesReady: boolean;
  unresolvedComplianceIssues: number;
  leadResponseHours?: number;
}

export interface OfficeHealthResult {
  score: number;
  activationReady: boolean;
  blockers: string[];
  nextActions: string[];
}

export class HierarchyHealthEngine {
  evaluate(signals: OfficeReadinessSignals): OfficeHealthResult {
    const checks = [
      ["credentialsReady", signals.credentialsReady, "Complete credentials / EFIN / PTIN readiness"],
      ["bankProductsConfigured", signals.bankProductsConfigured, "Finish bank-product configuration"],
      ["usersInvited", signals.usersInvited, "Invite and assign office users"],
      ["workflowsEnabled", signals.workflowsEnabled, "Enable required office workflows"],
      ["trainingComplete", signals.trainingComplete, "Complete required training"],
      ["consentTemplatesReady", signals.consentTemplatesReady, "Configure disclosures and consent templates"]
    ] as const;

    const passed = checks.filter(([, value]) => value).length;
    const compliancePenalty = Math.min(signals.unresolvedComplianceIssues * 0.08, 0.32);
    const responsePenalty = signals.leadResponseHours && signals.leadResponseHours > 24 ? 0.12 : 0;
    const score = Math.max(0, Math.min(1, passed / checks.length - compliancePenalty - responsePenalty));
    const blockers = checks.filter(([, value]) => !value).map(([, , action]) => action);

    if (signals.unresolvedComplianceIssues > 0) blockers.push("Resolve compliance issues");

    return {
      score: Number(score.toFixed(4)),
      activationReady: score >= 0.9 && blockers.length === 0,
      blockers,
      nextActions: blockers.slice(0, 5)
    };
  }
}
