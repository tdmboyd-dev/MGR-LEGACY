export type PlaybookType="sales"|"marketing"|"proposal"|"reputation"|"recruiting"|"activation"|"referral"|"payment"|"onboarding";

export interface PlaybookStep {
  id:string;
  type:"task"|"message"|"workflow"|"approval"|"wait"|"score"|"document";
  config:Record<string,unknown>;
}

export interface Playbook {
  id:string;
  tenantId:string;
  type:PlaybookType;
  name:string;
  trigger:string;
  steps:PlaybookStep[];
  active:boolean;
}

export class PlaybookRegistry {
  private readonly playbooks=new Map<string,Playbook>();
  register(playbook:Playbook):void{this.playbooks.set(playbook.id,structuredClone(playbook));}
  list(tenantId:string,type?:PlaybookType):Playbook[]{
    return [...this.playbooks.values()]
      .filter(p=>p.tenantId===tenantId && (!type || p.type===type))
      .map(p=>structuredClone(p));
  }
}
