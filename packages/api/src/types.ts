import type { Command, NextAction, WorkflowDefinition } from "@mgr/legacy-contracts";
import type { Goal, ReportDefinition } from "@mgr/legacy-analytics";
import type { BankProductApplication, ClientPortalRequest, PreparerCredentialStatus, RequiredTaxDocument, SignatureAuthorization, TaxReturnLifecycleState } from "@mgr/legacy-tax-pack";

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
}

export interface ApiAuthConfig {
  bearerToken?:string;
}
