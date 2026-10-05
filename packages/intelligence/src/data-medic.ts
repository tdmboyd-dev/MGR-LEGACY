export interface DataIssue {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  type: "duplicate_candidate" | "missing_owner" | "invalid_email" | "invalid_phone" | "stale_record" | "lifecycle_conflict";
  severity: "info" | "warning" | "critical";
  evidence: Record<string, unknown>;
  suggestedFix?: Record<string, unknown>;
}

export class DataMedic {
  inspect(records: Array<{ tenantId:string; entityType:string; entityId:string; ownerId?:string; email?:string; phone?:string; updatedAt?:string }>): DataIssue[] {
    const issues: DataIssue[] = [];
    const seenEmails = new Map<string,string>();

    for (const record of records) {
      if (!record.ownerId) {
        issues.push({
          id:`missing-owner:${record.entityId}`,
          tenantId:record.tenantId,
          entityType:record.entityType,
          entityId:record.entityId,
          type:"missing_owner",
          severity:"warning",
          evidence:{}
        });
      }

      if (record.email) {
        const normalized = record.email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
          issues.push({
            id:`invalid-email:${record.entityId}`,
            tenantId:record.tenantId,
            entityType:record.entityType,
            entityId:record.entityId,
            type:"invalid_email",
            severity:"warning",
            evidence:{ email:record.email }
          });
        }
        const duplicateOf = seenEmails.get(`${record.tenantId}:${normalized}`);
        if (duplicateOf) {
          issues.push({
            id:`duplicate:${record.entityId}`,
            tenantId:record.tenantId,
            entityType:record.entityType,
            entityId:record.entityId,
            type:"duplicate_candidate",
            severity:"warning",
            evidence:{ duplicateOf, email:normalized }
          });
        } else {
          seenEmails.set(`${record.tenantId}:${normalized}`, record.entityId);
        }
      }
    }

    return issues;
  }
}
