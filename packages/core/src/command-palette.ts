export interface PaletteCommand {
  id:string;
  label:string;
  description:string;
  action:string;
  keywords:string[];
  scopeTypes:string[];
  risk:"low"|"medium"|"high"|"critical";
}

export class CommandPaletteRegistry {
  private readonly commands=new Map<string,PaletteCommand>();

  register(command:PaletteCommand):void{
    this.commands.set(command.id,structuredClone(command));
  }

  search(query:string,scopeType?:string):PaletteCommand[]{
    const q=query.trim().toLowerCase();
    return [...this.commands.values()]
      .filter(command=>!scopeType || command.scopeTypes.includes(scopeType))
      .filter(command=>!q || [command.label,command.description,...command.keywords].join(" ").toLowerCase().includes(q))
      .map(command=>structuredClone(command));
  }
}
