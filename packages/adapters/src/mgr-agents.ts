import type { Contact, Opportunity } from "@mgr/legacy-crm";

export interface MgrAgentsContactRow {
  id:string;
  userId:string;
  companyId?:string|null;
  firstName:string;
  lastName?:string|null;
  email?:string|null;
  phone?:string|null;
  company?:string|null;
  jobTitle?:string|null;
  status:"lead"|"prospect"|"customer"|"churned"|"archived";
  source?:string|null;
  tags?:string[]|null;
  score:number;
  customFields?:Record<string,unknown>|null;
  createdAt:Date|string;
  updatedAt:Date|string;
}

export interface MgrAgentsDealRow {
  id:string;
  userId:string;
  contactId?:string|null;
  companyId?:string|null;
  pipelineId:string;
  stageId:string;
  title:string;
  value:number;
  currency:string;
  status:"open"|"won"|"lost"|"abandoned";
  probability:number;
  expectedCloseDate?:Date|string|null;
  closedAt?:Date|string|null;
  createdAt:Date|string;
  updatedAt:Date|string;
}

export function mapMgrAgentsContact(row:MgrAgentsContactRow,tenantId:string):Contact {
  return {
    id:row.id,
    tenantId,
    ownerId:row.userId,
    firstName:row.firstName,
    lastName:row.lastName ?? undefined,
    email:row.email ?? undefined,
    phone:row.phone ?? undefined,
    companyId:row.companyId ?? undefined,
    status:row.status,
    source:row.source ?? undefined,
    tags:row.tags ?? [],
    score:row.score,
    customFields:{
      ...(row.customFields ?? {}),
      legacyCompanyName:row.company ?? undefined,
      legacyJobTitle:row.jobTitle ?? undefined
    },
    createdAt:new Date(row.createdAt).toISOString(),
    updatedAt:new Date(row.updatedAt).toISOString()
  };
}

export function mapMgrAgentsDeal(row:MgrAgentsDealRow,tenantId:string):Opportunity {
  return {
    id:row.id,
    tenantId,
    ownerId:row.userId,
    contactId:row.contactId ?? undefined,
    companyId:row.companyId ?? undefined,
    pipelineId:row.pipelineId,
    stageId:row.stageId,
    title:row.title,
    value:row.value,
    currency:row.currency,
    status:row.status,
    probability:row.probability,
    expectedCloseAt:row.expectedCloseDate ? new Date(row.expectedCloseDate).toISOString() : undefined,
    closedAt:row.closedAt ? new Date(row.closedAt).toISOString() : undefined,
    customFields:{ sourceSystem:"mgr-agents" },
    createdAt:new Date(row.createdAt).toISOString(),
    updatedAt:new Date(row.updatedAt).toISOString()
  };
}
