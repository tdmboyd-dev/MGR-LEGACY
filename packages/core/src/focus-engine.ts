export interface FocusCommitment {
  id:string;
  tenantId:string;
  ownerId:string;
  title:string;
  dueAt?:string;
  status:"planned"|"active"|"done"|"missed"|"cancelled";
  evidenceRefs:string[];
}

export class FocusEngine {
  prioritize(items:FocusCommitment[],now=new Date()):FocusCommitment[]{
    return [...items].sort((a,b)=>{
      const aOver=a.dueAt && new Date(a.dueAt)<now ? 1 : 0;
      const bOver=b.dueAt && new Date(b.dueAt)<now ? 1 : 0;
      if(aOver!==bOver) return bOver-aOver;
      return String(a.dueAt ?? "9999").localeCompare(String(b.dueAt ?? "9999"));
    });
  }
}
