import type { Command, NextAction, WorkflowDefinition } from "@mgr/legacy-contracts";

export interface CommandIngressInput {
  action:string;
  payload:Record<string,unknown>;
  metadata?:Record<string,unknown>;
}

export interface LegacyApiServices {
  health():Promise<Record<string,unknown>>;
  executeCommand(input:CommandIngressInput|Command):Promise<unknown>;
  today(ownerId:string,tenantId?:string):Promise<NextAction[]>;
  stageWorkflow(workflow:Omit<WorkflowDefinition,"version"|"status">):Promise<WorkflowDefinition>;
  simulateWorkflow(workflowId:string,version:number,eventIds:string[]):Promise<unknown>;
  installExtension(input:Record<string,unknown>):Promise<{id:string;version:string}>;
  listExtensions():Promise<Array<{id:string;version:string;status:string}>>;
  registerWebhook(extensionId:string,eventType:string,url:string):Promise<{subscriptionId:string}>;
}

export interface ApiAuthConfig {
  bearerToken?:string;
}
