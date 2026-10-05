export interface DataHealthCounts {
  totalRecords:number;
  duplicateCandidates:number;
  missingOwners:number;
  invalidContacts:number;
  staleRecords:number;
  lifecycleConflicts:number;
}

export class DataHealthEngine {
  evaluate(input:DataHealthCounts):{
    score:number;
    issueRate:number;
    grade:"A"|"B"|"C"|"D"|"F";
  }{
    const issues=input.duplicateCandidates+input.missingOwners+input.invalidContacts+input.staleRecords+input.lifecycleConflicts;
    const issueRate=input.totalRecords===0 ? 0 : Math.min(1,issues/input.totalRecords);
    const score=1-issueRate;
    const grade=score>=0.95?"A":score>=0.85?"B":score>=0.7?"C":score>=0.55?"D":"F";
    return {score,issueRate,grade};
  }
}
