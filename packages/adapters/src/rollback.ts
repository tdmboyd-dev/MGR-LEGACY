export interface CutoverState {
  source:"mgr-agents"|"elite-hub";
  entityType:string;
  readAuthority:"source"|"legacy";
  writeMode:"source_only"|"dual_write"|"legacy_only";
  changedAt:string;
  changedBy:string;
}

export interface CutoverStateStore {
  get(source:CutoverState["source"],entityType:string):Promise<CutoverState|null>;
  save(state:CutoverState):Promise<void>;
}

export class RollbackCoordinator {
  constructor(private readonly store:CutoverStateStore){}

  async rollback(
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
}
