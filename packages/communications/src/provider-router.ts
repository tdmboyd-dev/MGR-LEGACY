import type { Channel, ProviderAdapter } from "./index.js";

export interface ProviderSelection {
  provider:ProviderAdapter;
  healthy:boolean;
  latencyMs:number;
}

export class ProviderRouter {
  constructor(private readonly providers:ProviderAdapter[]){}

  async select(channel:Channel):Promise<ProviderSelection>{
    const candidates=this.providers.filter(provider=>provider.channel===channel);
    if(!candidates.length) throw new Error(`No providers configured for ${channel}`);

    const checks=await Promise.all(candidates.map(async provider=>{
      try{
        const health=await provider.health();
        return {
          provider,
          healthy:health.healthy,
          latencyMs:health.latencyMs ?? Number.MAX_SAFE_INTEGER
        };
      }catch{
        return {
          provider,
          healthy:false,
          latencyMs:Number.MAX_SAFE_INTEGER
        };
      }
    }));

    const healthy=checks
      .filter(item=>item.healthy)
      .sort((a,b)=>a.latencyMs-b.latencyMs);

    if(healthy.length) return healthy[0]!;

    throw new Error(`No healthy provider available for ${channel}`);
  }
}

export class FailoverProviderAdapter implements ProviderAdapter {
  readonly channel:Channel;

  constructor(
    channel:Channel,
    private readonly router:ProviderRouter
  ){
    this.channel=channel;
  }

  async send(message:Parameters<ProviderAdapter["send"]>[0]):ReturnType<ProviderAdapter["send"]>{
    const selected=await this.router.select(this.channel);
    return selected.provider.send(message);
  }

  async health():ReturnType<ProviderAdapter["health"]>{
    try{
      const selected=await this.router.select(this.channel);
      return {healthy:true,latencyMs:selected.latencyMs};
    }catch(error){
      return {
        healthy:false,
        details:{error:error instanceof Error ? error.message : String(error)}
      };
    }
  }
}
