export type LocalCapability =
  | "clipboard.read" | "clipboard.write"
  | "file.read" | "file.write"
  | "browser.navigate" | "browser.interact"
  | "screen.capture" | "camera.read"
  | "hotkey.register" | "notification.send";

export interface LocalBridgeGrant {
  capability:LocalCapability;
  resource?:string;
  expiresAt?:string;
}

export interface LocalBridgeRequest {
  requestId:string;
  actorId:string;
  capability:LocalCapability;
  resource?:string;
  parameters:Record<string,unknown>;
}

export interface LocalBridgePolicy {
  authorize(request:LocalBridgeRequest,grants:LocalBridgeGrant[],now?:Date):{
    allowed:boolean;
    reason:string;
  };
}

export class LeastPrivilegeLocalBridgePolicy implements LocalBridgePolicy {
  authorize(request:LocalBridgeRequest,grants:LocalBridgeGrant[],now=new Date()){
    const grant=grants.find(item=>
      item.capability===request.capability &&
      (!item.resource || item.resource===request.resource) &&
      (!item.expiresAt || new Date(item.expiresAt)>now)
    );
    return grant
      ? {allowed:true,reason:"Explicit capability grant matched"}
      : {allowed:false,reason:"No matching least-privilege grant"};
  }
}

export interface ExactTargetAction {
  application:string;
  target:string;
  action:string;
  parameters:Record<string,unknown>;
}

export class ExactTargetValidator {
  validate(input:ExactTargetAction):string[]{
    const errors:string[]=[];
    if(!input.application.trim()) errors.push("Application is required");
    if(!input.target.trim()) errors.push("Exact target is required");
    if(!input.action.trim()) errors.push("Action is required");
    if(input.target==="*" || input.target.toLowerCase()==="any") errors.push("Wildcard targets are forbidden");
    return errors;
  }
}
