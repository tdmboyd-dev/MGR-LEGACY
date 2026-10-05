export interface MemoryNode {
  id:string;
  tenantId:string;
  kind:"fact"|"preference"|"decision"|"artifact"|"relationship"|"episode";
  content:unknown;
  source:string;
  confidence:number;
  trusted:boolean;
  createdAt:string;
  expiresAt?:string;
}

export interface MemoryEdge {
  from:string;
  to:string;
  type:string;
  weight:number;
}

export interface MemoryGraph {
  upsert(node:MemoryNode):Promise<void>;
  link(edge:MemoryEdge):Promise<void>;
  related(tenantId:string,nodeId:string,limit?:number):Promise<MemoryNode[]>;
}
