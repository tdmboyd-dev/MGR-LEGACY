export interface DualWriteResult<T> {
  source: T;
  legacy: T;
  matched: boolean;
  differences: string[];
}

export interface DualWritePort<TInput,TOutput> {
  writeSource(input:TInput):Promise<TOutput>;
  writeLegacy(input:TInput):Promise<TOutput>;
  compare(source:TOutput,legacy:TOutput):string[];
}

export class DualWriteCoordinator<TInput,TOutput> {
  constructor(private readonly port:DualWritePort<TInput,TOutput>) {}

  async execute(input:TInput):Promise<DualWriteResult<TOutput>> {
    const [source,legacy]=await Promise.all([
      this.port.writeSource(input),
      this.port.writeLegacy(input)
    ]);
    const differences=this.port.compare(source,legacy);
    return {source,legacy,matched:differences.length===0,differences};
  }
}

export interface CutoverGateInput {
  reconciledPercent:number;
  mismatchCount:number;
  duplicateCount:number;
  errorRate:number;
  rollbackReady:boolean;
  auditComplete:boolean;
}

export interface CutoverGateResult {
  ready:boolean;
  blockers:string[];
}

export class CutoverGate {
  evaluate(input:CutoverGateInput):CutoverGateResult {
    const blockers:string[]=[];
    if(input.reconciledPercent<100) blockers.push("Reconciliation is not 100%");
    if(input.mismatchCount>0) blockers.push("Unresolved record mismatches remain");
    if(input.duplicateCount>0) blockers.push("Duplicate destination records remain");
    if(input.errorRate>0.001) blockers.push("Migration error rate exceeds 0.1%");
    if(!input.rollbackReady) blockers.push("Rollback plan is not verified");
    if(!input.auditComplete) blockers.push("Migration audit evidence is incomplete");
    return {ready:blockers.length===0,blockers};
  }
}
