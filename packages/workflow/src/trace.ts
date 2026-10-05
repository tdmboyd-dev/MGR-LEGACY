export interface TraceEntry {
  runId:string;
  nodeId:string;
  event:"queued"|"started"|"waiting"|"retried"|"succeeded"|"failed"|"skipped"|"approved"|"denied";
  attempt:number;
  at:string;
  durationMs?:number;
  input?:Record<string,unknown>;
  output?:Record<string,unknown>;
  error?:string;
  metadata:Record<string,unknown>;
}

export interface TraceRepository {
  append(entry:TraceEntry):Promise<void>;
  list(runId:string):Promise<TraceEntry[]>;
}

export class ExecutionTracer {
  constructor(private readonly repo:TraceRepository){}
  append(entry:TraceEntry):Promise<void>{ return this.repo.append(entry); }
  list(runId:string):Promise<TraceEntry[]>{ return this.repo.list(runId); }
}
