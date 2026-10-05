export interface ToolCapability {
  id:string;
  description:string;
  actions:string[];
  risk:"low"|"medium"|"high"|"critical";
  scopes:string[];
  enabled:boolean;
}

export class ToolMap {
  private readonly tools=new Map<string,ToolCapability>();

  register(tool:ToolCapability):void{
    if(this.tools.has(tool.id)) throw new Error(`Tool already registered: ${tool.id}`);
    this.tools.set(tool.id,structuredClone(tool));
  }

  select(action:string,scope:string):ToolCapability[]{
    return [...this.tools.values()]
      .filter(tool=>tool.enabled && tool.actions.includes(action) && tool.scopes.includes(scope))
      .map(tool=>structuredClone(tool));
  }
}
