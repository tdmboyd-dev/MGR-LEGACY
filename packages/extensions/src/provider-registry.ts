export interface ExternalProviderRegistration {
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
  private readonly providers=new Map<string,ExternalProviderRegistration>();

  register(provider:ExternalProviderRegistration):void{
    if(this.providers.has(provider.id)) throw new Error(`Provider already registered: ${provider.id}`);
    this.providers.set(provider.id,structuredClone(provider));
  }

  list(channel?:string):ExternalProviderRegistration[]{
    return [...this.providers.values()]
      .filter(provider=>provider.enabled && (!channel || provider.channel===channel))
      .sort((a,b)=>a.priority-b.priority)
      .map(provider=>structuredClone(provider));
  }

  resolve(channel:string,capability?:string):ExternalProviderRegistration|null{
    return this.list(channel).find(provider=>!capability || provider.capabilities.includes(capability)) ?? null;
  }
}
