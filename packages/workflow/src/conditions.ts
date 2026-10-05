export type ConditionOperator="eq"|"neq"|"gt"|"gte"|"lt"|"lte"|"in"|"contains"|"exists";

export interface WorkflowCondition {
  field:string;
  operator:ConditionOperator;
  value?:unknown;
}

function getPath(input:unknown,path:string):unknown{
  return path.split(".").reduce((value,key)=>{
    if(value && typeof value==="object") return (value as Record<string,unknown>)[key];
    return undefined;
  },input);
}

export class ConditionEvaluator {
  evaluate(condition:WorkflowCondition,context:Record<string,unknown>):boolean{
    const actual=getPath(context,condition.field);
    switch(condition.operator){
      case "eq": return actual===condition.value;
      case "neq": return actual!==condition.value;
      case "gt": return Number(actual)>Number(condition.value);
      case "gte": return Number(actual)>=Number(condition.value);
      case "lt": return Number(actual)<Number(condition.value);
      case "lte": return Number(actual)<=Number(condition.value);
      case "in": return Array.isArray(condition.value) && condition.value.includes(actual);
      case "contains": return Array.isArray(actual)
        ? actual.includes(condition.value)
        : typeof actual==="string" && String(actual).includes(String(condition.value ?? ""));
      case "exists": return condition.value===false ? actual===undefined || actual===null : actual!==undefined && actual!==null;
    }
  }

  evaluateAll(conditions:WorkflowCondition[],context:Record<string,unknown>):boolean{
    return conditions.every(condition=>this.evaluate(condition,context));
  }
}
