export interface PolicySource {
  id:string;
  effect:"allow"|"deny"|"require_approval";
  actions:string[];
  resourceTypes:string[];
  conditions:Record<string,unknown>;
  priority:number;
}

export interface CompiledPolicy {
  version:string;
  rules:PolicySource[];
  defaultEffect:"deny";
}

export class PolicyCompiler {
  compile(version:string,sources:PolicySource[]):CompiledPolicy{
    const rules=[...sources].sort((a,b)=>b.priority-a.priority);
    return {version,rules,defaultEffect:"deny"};
  }

  evaluate(policy:CompiledPolicy,input:{
    action:string;
    resourceType:string;
    attributes:Record<string,unknown>;
  }):{effect:"allow"|"deny"|"require_approval";ruleId?:string;reason:string}{
    const matches=policy.rules.filter(rule=>
      rule.actions.some(a=>a==="*" || a===input.action) &&
      rule.resourceTypes.some(r=>r==="*" || r===input.resourceType) &&
      Object.entries(rule.conditions).every(([k,v])=>input.attributes[k]===v)
    );
    const deny=matches.find(rule=>rule.effect==="deny");
    if(deny) return {effect:"deny",ruleId:deny.id,reason:"Explicit deny matched"};
    const approval=matches.find(rule=>rule.effect==="require_approval");
    if(approval) return {effect:"require_approval",ruleId:approval.id,reason:"Approval rule matched"};
    const allow=matches.find(rule=>rule.effect==="allow");
    if(allow) return {effect:"allow",ruleId:allow.id,reason:"Allow rule matched"};
    return {effect:"deny",reason:"Default deny"};
  }
}
