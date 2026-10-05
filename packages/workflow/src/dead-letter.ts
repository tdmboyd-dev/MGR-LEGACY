export interface DeadLetterItem {
  id:string;
  tenantId:string;
  workflowId:string;
  runId:string;
  nodeId?:string;
  error:string;
  payload:Record<string,unknown>;
  attempts:number;
  failedAt:string;
  status:"open"|"requeued"|"discarded"|"resolved";
}

export interface DeadLetterStore {
  add(item:DeadLetterItem):Promise<void>;
  listOpen(tenantId:string,limit?:number):Promise<DeadLetterItem[]>;
  updateStatus(id:string,status:DeadLetterItem["status"]):Promise<void>;
}

export class DeadLetterRecovery {
  constructor(private readonly store:DeadLetterStore){}

  async requeue(item:DeadLetterItem,requeue:(item:DeadLetterItem)=>Promise<void>):Promise<void>{
    await requeue(item);
    await this.store.updateStatus(item.id,"requeued");
  }
}
