export interface PreparerCredentialStatus {
  preparerId:string;
  ptinValid:boolean;
  efinLinked:boolean;
  ceComplete:boolean;
  expiresAt?:string;
  issues:string[];
}

export class CredentialReadinessEngine {
  ready(status:PreparerCredentialStatus):{ready:boolean;blockers:string[]}{
    const blockers=[...status.issues];
    if(!status.ptinValid) blockers.push("PTIN invalid or missing");
    if(!status.efinLinked) blockers.push("EFIN not linked");
    if(!status.ceComplete) blockers.push("Continuing education incomplete");
    if(status.expiresAt && new Date(status.expiresAt)<=new Date()) blockers.push("Credential expired");
    return {ready:blockers.length===0,blockers};
  }
}

export interface BureauMetric {
  bureauId:string;
  officeId?:string;
  preparerId?:string;
  returns:number;
  revenue:number;
  accepted:number;
  rejected:number;
  avgCycleHours:number;
}

export class BureauAnalyticsEngine {
  summarize(rows:BureauMetric[]):{
    returns:number;revenue:number;acceptanceRate:number;avgCycleHours:number;
  }{
    const returns=rows.reduce((s,r)=>s+r.returns,0);
    const revenue=rows.reduce((s,r)=>s+r.revenue,0);
    const accepted=rows.reduce((s,r)=>s+r.accepted,0);
    const rejected=rows.reduce((s,r)=>s+r.rejected,0);
    const weightedCycle=rows.reduce((s,r)=>s+r.avgCycleHours*r.returns,0);
    return {
      returns,
      revenue,
      acceptanceRate:(accepted+rejected)===0?0:accepted/(accepted+rejected),
      avgCycleHours:returns===0?0:weightedCycle/returns
    };
  }
}
