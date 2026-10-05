import type { Command, NextAction, WorkflowDefinition } from "@mgr/legacy-contracts";
import type { Goal, ReportDefinition } from "@mgr/legacy-analytics";
import type { BankProductApplication, ClientPortalRequest, PreparerCredentialStatus, RequiredTaxDocument, SignatureAuthorization, TaxReturnLifecycleState } from "@mgr/legacy-tax-pack";
import type { ActionReceipt, ActionReceiptStatus, TruthConsoleRow } from "@mgr/legacy-core";

export interface CommandIngressInput {
  action:string;
  payload:Record<string,unknown>;
  metadata?:Record<string,unknown>;
}

export interface LegacyApiServices {
  health():Promise<Record<string,unknown>>;
  executeCommand(input:CommandIngressInput|Command):Promise<unknown>;
  today(ownerId:string,tenantId?:string):Promise<NextAction[]>;
  stageWorkflow(
    workflow:Omit<WorkflowDefinition,"version"|"status">,
    tenantId?:string
  ):Promise<WorkflowDefinition>;
  simulateWorkflow(
    workflowId:string,
    version:number,
    eventIds:string[],
    tenantId?:string
  ):Promise<unknown>;
  installExtension(input:Record<string,unknown>,tenantId?:string):Promise<{id:string;version:string}>;
  listExtensions(tenantId?:string):Promise<Array<{id:string;version:string;status:string}>>;
  registerWebhook(
    extensionId:string,
    eventType:string,
    url:string,
    tenantId?:string
  ):Promise<{subscriptionId:string}>;

  saveReport(definition:ReportDefinition,tenantId?:string):Promise<void>;
  listReports(tenantId?:string):Promise<ReportDefinition[]>;
  saveGoal(goal:Goal,tenantId?:string):Promise<void>;
  listGoals(tenantId?:string,scopeType?:string,scopeId?:string):Promise<Goal[]>;
  metricSeries(input:{
    metricKey:string;
    from?:string;
    to?:string;
    scopeType?:string;
    scopeId?:string;
  },tenantId?:string):Promise<Array<{
    value:number;
    observedAt:string;
    dimensions:Record<string,string>;
  }>>;
  saveTaxRequiredDocuments(input:{
    clientEntityId:string;
    taxYear:number;
    documents:RequiredTaxDocument[];
  },tenantId?:string):Promise<void>;
  saveTaxReturn(state:TaxReturnLifecycleState,tenantId?:string):Promise<void>;
  saveTaxSignature(auth:SignatureAuthorization,tenantId?:string):Promise<void>;
  saveTaxBankProduct(app:BankProductApplication,tenantId?:string):Promise<void>;
  saveTaxCredential(status:PreparerCredentialStatus,tenantId?:string):Promise<void>;
  createTaxPortalRequest(request:ClientPortalRequest,tenantId?:string):Promise<void>;
  listActionReceipts(input:{
    correlationId?:string;
    actorId?:string;
    action?:string;
    status?:ActionReceiptStatus;
    limit?:number;
  },tenantId?:string):Promise<ActionReceipt[]>;
  truthConsole(input:{
    correlationId?:string;
    actorId?:string;
    action?:string;
    status?:ActionReceiptStatus;
    limit?:number;
  },tenantId?:string):Promise<TruthConsoleRow[]>;
  truthSummary(input:{
    correlationId?:string;
    actorId?:string;
    action?:string;
    status?:ActionReceiptStatus;
    limit?:number;
  },tenantId?:string):Promise<{
    total:number;
    succeeded:number;
    failed:number;
    blocked:number;
    approvalRate:number;
    totalProviderCost:number;
  }>;
}

export interface ApiAuthConfig {
  bearerToken?:string;
}
