export interface OutboxRecord {
  id:number;
  eventId:string;
  topic:string;
  payload:Record<string,unknown>;
  attempts:number;
}

export interface OutboxStore {
  claim(limit:number,workerId:string):Promise<OutboxRecord[]>;
  markPublished(id:number):Promise<void>;
  markFailed(id:number,error:string,nextAttemptAt:string):Promise<void>;
}

export interface EventPublisher {
  publish(topic:string,payload:Record<string,unknown>):Promise<void>;
}

export interface OutboxPublisherResult {
  claimed:number;
  published:number;
  failed:number;
}

export class ReliableOutboxPublisher {
  constructor(
    private readonly store:OutboxStore,
    private readonly publisher:EventPublisher
  ) {}

  async runOnce(
    workerId:string,
    limit=100,
    now=new Date()
  ):Promise<OutboxPublisherResult>{
    const records=await this.store.claim(limit,workerId);
    let published=0;
    let failed=0;

    for(const record of records){
      try{
        await this.publisher.publish(record.topic,record.payload);
        await this.store.markPublished(record.id);
        published+=1;
      }catch(error){
        const attempts=record.attempts+1;
        const delayMs=Math.min(300_000,1000*Math.pow(2,Math.max(0,attempts-1)));
        const nextAttemptAt=new Date(now.getTime()+delayMs).toISOString();
        await this.store.markFailed(
          record.id,
          error instanceof Error ? error.message : String(error),
          nextAttemptAt
        );
        failed+=1;
      }
    }

    return {claimed:records.length,published,failed};
  }
}
