export interface ProviderRegistration {
  id:string;
  channel:string;
  capabilities:string[];
  endpoint?:string;
  healthEndpoint?:string;
  secretRefs:string[];
  enabled:boolean;
  priority:number;
}

export class ProviderRegistry {
  private readonly providers=new Map<string,ProviderRegistration>();

  register(provider:ProviderRegistration):void{
    if(this.providers.has(provider.id)) throw new Error(`Provider already registered: ${provider.id}`);
    this.providers.set(provider.id,structuredClone(provider));
  }

  list(channel?:string):ProviderRegistration[]{
    return [...this.providers.values()]
      .filter(provider=>provider.enabled && (!channel || provider.channel===channel))
      .sort((a,b)=>a.priority-b.priority)
      .map(provider=>structuredClone(provider));
  }

  resolve(channel:string,capability?:string):ProviderRegistration|null{
    return this.list(channel).find(provider=>!capability || provider.capabilities.includes(capability)) ?? null;
  }
}
