import { CutoverGate, type CutoverGateInput } from "./cutover.js";
import type { CutoverState, CutoverStateStore } from "./rollback.js";

export interface CutoverRequest extends CutoverGateInput {
  source:CutoverState["source"];
  entityType:string;
  actorId:string;
}

export class CutoverOrchestrator {
  private readonly gate=new CutoverGate();

  constructor(private readonly store:CutoverStateStore){}

  async enableDualWrite(
    source:CutoverState["source"],
    entityType:string,
    actorId:string,
    now=new Date()
  ):Promise<CutoverState>{
    const state:CutoverState={
      source,
      entityType,
      readAuthority:"source",
      writeMode:"dual_write",
      changedAt:now.toISOString(),
      changedBy:actorId
    };
    await this.store.save(state);
    return state;
  }

  async cutoverReads(request:CutoverRequest,now=new Date()):Promise<CutoverState>{
    const result=this.gate.evaluate(request);
    if(!result.ready) throw new Error(`Cutover blocked: ${result.blockers.join("; ")}`);

    const state:CutoverState={
      source:request.source,
      entityType:request.entityType,
      readAuthority:"legacy",
      writeMode:"dual_write",
      changedAt:now.toISOString(),
      changedBy:request.actorId
    };
    await this.store.save(state);
    return state;
  }

  async finalizeLegacyWrites(
    source:CutoverState["source"],
    entityType:string,
    actorId:string,
    now=new Date()
  ):Promise<CutoverState>{
    const current=await this.store.get(source,entityType);
    if(!current || current.readAuthority!=="legacy"){
      throw new Error("Reads must be cut over to Legacy before source writes are retired");
    }
    const state:CutoverState={
      ...current,
      writeMode:"legacy_only",
      changedAt:now.toISOString(),
      changedBy:actorId
    };
    await this.store.save(state);
    return state;
  }
}
