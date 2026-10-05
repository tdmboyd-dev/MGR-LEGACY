import type { Channel } from "./index.js";

export interface MessageTemplate {
  id:string;
  tenantId:string;
  name:string;
  channel:Channel;
  subject?:string;
  body:string;
  variables:string[];
  active:boolean;
}

export class TemplateRenderer {
  render(template:MessageTemplate,variables:Record<string,unknown>):{subject?:string;body:string}{
    const replace=(input:string)=>input.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,(_m,key)=>{
      if(!(key in variables)) throw new Error(`Missing template variable: ${key}`);
      return String(variables[key] ?? "");
    });
    return {subject:template.subject ? replace(template.subject):undefined,body:replace(template.body)};
  }
}

export interface SequenceStep {
  id:string;
  order:number;
  channel:Channel;
  templateId:string;
  delayMs:number;
  stopOnReply:boolean;
}

export interface SequenceDefinition {
  id:string;
  tenantId:string;
  name:string;
  steps:SequenceStep[];
  active:boolean;
}

export interface SequenceEnrollment {
  id:string;
  sequenceId:string;
  tenantId:string;
  contactId:string;
  currentStep:number;
  nextRunAt:string;
  status:"active"|"paused"|"completed"|"stopped";
  replied:boolean;
}

export class SequencePlanner {
  next(definition:SequenceDefinition,enrollment:SequenceEnrollment,now=new Date()):{
    step?:SequenceStep;
    nextRunAt?:string;
    status:SequenceEnrollment["status"];
  }{
    if(enrollment.status!=="active") return {status:enrollment.status};
    if(enrollment.replied){
      const prior=definition.steps[Math.max(0,enrollment.currentStep-1)];
      if(prior?.stopOnReply) return {status:"stopped"};
    }
    const step=[...definition.steps].sort((a,b)=>a.order-b.order)[enrollment.currentStep];
    if(!step) return {status:"completed"};
    return {step,nextRunAt:new Date(now.getTime()+step.delayMs).toISOString(),status:"active"};
  }
}
