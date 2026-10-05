export interface EvidenceItem {
  source:string;
  type:string;
  weight:number;
  observedAt?:string;
  details:Record<string,unknown>;
}

export interface Explanation {
  summary:string;
  confidence:number;
  evidence:EvidenceItem[];
  caveats:string[];
}

export class ExplanationBuilder {
  build(summary:string,evidence:EvidenceItem[],caveats:string[]=[]):Explanation{
    const total=evidence.reduce((sum,item)=>sum+Math.max(0,item.weight),0);
    const confidence=evidence.length===0 ? 0 : Math.min(1,total/evidence.length);
    return {summary,confidence:Number(confidence.toFixed(4)),evidence,caveats};
  }
}
