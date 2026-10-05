export interface EvaluationCase<I=unknown,O=unknown> {
  id:string;
  category:string;
  input:I;
  expected?:O;
  invariants:string[];
  risk:"low"|"medium"|"high"|"critical";
}

export interface EvaluationResult {
  caseId:string;
  passed:boolean;
  score:number;
  violations:string[];
  evidence:Record<string,unknown>;
  durationMs:number;
}

export interface EvaluationRunner<I=unknown,O=unknown> {
  run(test:EvaluationCase<I,O>):Promise<EvaluationResult>;
}

export class TevvSuite {
  async run<I,O>(cases:EvaluationCase<I,O>[],runner:EvaluationRunner<I,O>):Promise<{
    passed:boolean;
    score:number;
    results:EvaluationResult[];
  }>{
    const results:EvaluationResult[]=[];
    for(const test of cases) results.push(await runner.run(test));
    const criticalFailure=results.some((result,index)=>cases[index]?.risk==="critical" && !result.passed);
    const score=results.length===0?0:results.reduce((sum,r)=>sum+r.score,0)/results.length;
    return {passed:!criticalFailure && results.every(r=>r.passed),score,results};
  }
}
