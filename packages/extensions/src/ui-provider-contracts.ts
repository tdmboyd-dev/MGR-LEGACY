export interface UiExtensionPanel {
  id:string;
  extensionId:string;
  placement:"contact_sidebar"|"deal_sidebar"|"dashboard_widget"|"case_sidebar"|"settings";
  title:string;
  route:string;
  requiredPermissions:string[];
}

export interface ProviderRegistration {
  key:string;
  extensionId:string;
  capability:string;
  channels?:string[];
  priority:number;
  configSchema:Record<string,unknown>;
}

export class ProviderRegistrationRegistry {
  private readonly providers=new Map<string,ProviderRegistration>();

  register(provider:ProviderRegistration):void{
    if(this.providers.has(provider.key)) throw new Error(`Provider already registered: ${provider.key}`);
    this.providers.set(provider.key,structuredClone(provider));
  }

  byCapability(capability:string):ProviderRegistration[]{
    return structuredClone([...this.providers.values()].filter(item=>item.capability===capability).sort((a,b)=>a.priority-b.priority));
  }
}
