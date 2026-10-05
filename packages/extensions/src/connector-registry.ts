export type ConnectorTransport="mcp"|"http"|"webhook"|"local";

export interface ConnectorCapability {
  name:string;
  description:string;
  inputSchema:Record<string,unknown>;
  outputSchema?:Record<string,unknown>;
  risk:"low"|"medium"|"high"|"critical";
}

export interface ConnectorManifest {
  id:string;
  version:string;
  transport:ConnectorTransport;
  endpoint?:string;
  capabilities:ConnectorCapability[];
  requiredSecrets:string[];
  enabled:boolean;
}

export class ConnectorRegistry {
  private readonly manifests=new Map<string,ConnectorManifest>();

  register(manifest:ConnectorManifest):void{
    const key=`${manifest.id}@${manifest.version}`;
    if(this.manifests.has(key)) throw new Error(`Connector already registered: ${key}`);
    this.manifests.set(key,structuredClone(manifest));
  }

  get(id:string,version?:string):ConnectorManifest|null{
    const candidates=[...this.manifests.values()].filter(item=>item.id===id && (!version || item.version===version));
    return structuredClone(candidates.sort((a,b)=>b.version.localeCompare(a.version,{numeric:true}))[0] ?? null);
  }

  list():ConnectorManifest[]{
    return [...this.manifests.values()].map(item=>structuredClone(item));
  }
}
