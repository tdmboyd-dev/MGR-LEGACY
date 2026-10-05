export interface ContextItem {
  key:string;
  value:unknown;
  source:string;
  confidence:number;
  sensitivity:"public"|"internal"|"private"|"restricted";
  expiresAt?:string;
  evidenceRefs:string[];
}

export interface ContextBundle {
  tenantId:string;
  subjectId?:string;
  goal:string;
  items:ContextItem[];
  generatedAt:string;
}

export class ContextMesh {
  assemble(input:{tenantId:string;subjectId?:string;goal:string;items:ContextItem[]},now=new Date()):ContextBundle{
    const items=input.items
      .filter(item=>!item.expiresAt || new Date(item.expiresAt)>now)
      .sort((a,b)=>b.confidence-a.confidence);
    return {...input,items,generatedAt:now.toISOString()};
  }
}
