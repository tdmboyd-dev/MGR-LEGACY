export interface RepairOperation {
  id:string;
  entityType:string;
  entityId:string;
  action:"set_field"|"merge_records"|"remove_value"|"add_relationship";
  before:unknown;
  after:unknown;
  field?:string;
  reversible:boolean;
  reason:string;
}

export interface RepairPlan {
  id:string;
  tenantId:string;
  operations:RepairOperation[];
  createdAt:string;
  status:"proposed"|"approved"|"applied"|"rolled_back";
}

export class DataRepairEngine {
  rollback(plan:RepairPlan):RepairPlan{
    if(plan.status!=="applied") throw new Error("Only applied repair plans can be rolled back");
    if(plan.operations.some(op=>!op.reversible)) throw new Error("Repair plan contains irreversible operations");
    return {
      ...plan,
      status:"rolled_back",
      operations:plan.operations.map(op=>({...op,before:op.after,after:op.before}))
    };
  }
}
