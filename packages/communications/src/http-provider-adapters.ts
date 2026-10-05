import type { Channel, ProviderAdapter } from "./index.js";

export interface HttpProviderConfig {
  channel:Channel;
  endpoint:string;
  healthEndpoint?:string;
  headers?:Record<string,string>;
  mapPayload?:(message:Parameters<ProviderAdapter["send"]>[0])=>unknown;
  parseResponse?:(response:unknown)=>{providerMessageId:string;acceptedAt?:string};
}

export class HttpProviderAdapter implements ProviderAdapter {
  readonly channel:Channel;

  constructor(private readonly config:HttpProviderConfig){
    this.channel=config.channel;
  }

  async send(message:Parameters<ProviderAdapter["send"]>[0]):Promise<{providerMessageId:string;acceptedAt:string}>{
    const response=await fetch(this.config.endpoint,{
      method:"POST",
      headers:{"content-type":"application/json",...(this.config.headers ?? {})},
      body:JSON.stringify(this.config.mapPayload ? this.config.mapPayload(message) : message)
    });
    if(!response.ok) throw new Error(`Provider send failed: HTTP ${response.status}`);
    const body=await response.json().catch(()=>({}));
    const parsed=this.config.parseResponse
      ? this.config.parseResponse(body)
      : {providerMessageId:String((body as any).id ?? (body as any).messageId ?? crypto.randomUUID())};
    return {providerMessageId:parsed.providerMessageId,acceptedAt:parsed.acceptedAt ?? new Date().toISOString()};
  }

  async health():Promise<{healthy:boolean;latencyMs?:number;details?:Record<string,unknown>}>{
    const endpoint=this.config.healthEndpoint ?? this.config.endpoint;
    const started=Date.now();
    try{
      const response=await fetch(endpoint,{method:"GET",headers:this.config.headers});
      return {healthy:response.ok,latencyMs:Date.now()-started,details:{status:response.status}};
    }catch(error){
      return {healthy:false,latencyMs:Date.now()-started,details:{error:error instanceof Error?error.message:String(error)}};
    }
  }
}

export const createEmailAdapter=(config:Omit<HttpProviderConfig,"channel">)=>new HttpProviderAdapter({...config,channel:"email"});
export const createSmsAdapter=(config:Omit<HttpProviderConfig,"channel">)=>new HttpProviderAdapter({...config,channel:"sms"});
export const createVoiceAdapter=(config:Omit<HttpProviderConfig,"channel">)=>new HttpProviderAdapter({...config,channel:"voice"});
