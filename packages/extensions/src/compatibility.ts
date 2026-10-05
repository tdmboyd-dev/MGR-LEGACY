import type { LegacyExtensionManifest } from "./index.js";

export interface ExtensionCompatibilityContext {
  platformVersion:string;
  supportedCapabilities:Set<string>;
  grantedPermissions:Set<string>;
  supportedWorkflowNodeTypes:Set<string>;
}

export interface ExtensionCompatibilityResult {
  compatible:boolean;
  blockers:string[];
  warnings:string[];
}

export class ExtensionCompatibilityChecker {
  check(
    manifest:LegacyExtensionManifest,
    context:ExtensionCompatibilityContext
  ):ExtensionCompatibilityResult{
    const blockers:string[]=[];
    const warnings:string[]=[];

    for(const capability of manifest.capabilities){
      if(!context.supportedCapabilities.has(capability)){
        blockers.push(`Unsupported capability: ${capability}`);
      }
    }

    for(const permission of manifest.permissions){
      for(const action of permission.actions){
        const key=`${permission.resource}:${action}`;
        if(!context.grantedPermissions.has(key)){
          blockers.push(`Permission not granted: ${key}`);
        }
      }
    }

    for(const node of manifest.workflowNodes){
      if(!context.supportedWorkflowNodeTypes.has(node.type)){
        blockers.push(`Unsupported workflow node type: ${node.type}`);
      }
      if(node.configSchemaVersion>1){
        warnings.push(`Workflow node ${node.type} uses config schema v${node.configSchemaVersion}`);
      }
    }

    if(!/^\d+\.\d+\.\d+/.test(manifest.version)){
      warnings.push("Extension version is not semantic-version formatted");
    }

    return {compatible:blockers.length===0,blockers,warnings};
  }
}

export class ExtensionSandboxPolicy {
  canCall(resource:string,action:string,grantedPermissions:Set<string>):boolean{
    return grantedPermissions.has(`${resource}:${action}`);
  }

  assertAllowed(resource:string,action:string,grantedPermissions:Set<string>):void{
    if(!this.canCall(resource,action,grantedPermissions)){
      throw new Error(`Extension sandbox denied ${resource}:${action}`);
    }
  }
}
