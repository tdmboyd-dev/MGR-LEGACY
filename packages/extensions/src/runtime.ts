export interface EventSubscription {
  id:string;
  extensionId:string;
  eventType:string;
  webhookUrl?:string;
  enabled:boolean;
}

export interface ExtensionEvent {
  type:string;
  payload:Record<string,unknown>;
  occurredAt:string;
}

export interface WebhookDeliveryResult {
  subscriptionId:string;
  delivered:boolean;
  status?:number;
  error?:string;
}

export class ExtensionEventDispatcher {
  constructor(private readonly fetcher:typeof fetch=fetch){}

  async dispatch(event:ExtensionEvent,subscriptions:EventSubscription[]):Promise<WebhookDeliveryResult[]>{
    const targets=subscriptions.filter(sub=>sub.enabled && sub.eventType===event.type && sub.webhookUrl);
    return Promise.all(targets.map(async sub=>{
      try{
        const response=await this.fetcher(sub.webhookUrl!,{
          method:"POST",
          headers:{"content-type":"application/json"},
          body:JSON.stringify(event)
        });
        return {subscriptionId:sub.id,delivered:response.ok,status:response.status};
      }catch(error){
        return {subscriptionId:sub.id,delivered:false,error:error instanceof Error?error.message:String(error)};
      }
    }));
  }
}

export interface PackRegistration {
  id:string;
  version:string;
  kind:"extension"|"vertical_pack"|"provider_adapter";
  status:"draft"|"active"|"disabled";
  manifest:Record<string,unknown>;
  installedAt:string;
}

export class PackRegistry {
  private readonly rows=new Map<string,PackRegistration>();

  register(pack:PackRegistration):void{
    const key=`${pack.id}@${pack.version}`;
    if(this.rows.has(key)) throw new Error(`Pack already registered: ${key}`);
    this.rows.set(key,structuredClone(pack));
  }

  activate(id:string,version:string):void{
    const key=`${id}@${version}`;
    const pack=this.rows.get(key);
    if(!pack) throw new Error("Pack not found");
    for(const [k,row] of this.rows){
      if(row.id===id && row.status==="active") this.rows.set(k,{...row,status:"disabled"});
    }
    this.rows.set(key,{...pack,status:"active"});
  }

  list(kind?:PackRegistration["kind"]):PackRegistration[]{
    return structuredClone([...this.rows.values()].filter(row=>!kind || row.kind===kind));
  }
}
