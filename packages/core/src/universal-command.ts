import type { Command } from "@mgr/legacy-contracts";

export interface CommandIntent {
  action:string;
  targetType?:string;
  targetId?:string;
  arguments:Record<string,unknown>;
  confidence:number;
  explanation:string;
}

export interface CommandInterpreter {
  interpret(input:string,context:Record<string,unknown>):Promise<CommandIntent[]>;
}

export interface CommandCatalogEntry {
  action:string;
  resourceType:string;
  requiresTarget:boolean;
  description:string;
}

export class UniversalCommandRegistry {
  private readonly entries=new Map<string,CommandCatalogEntry>();

  register(entry:CommandCatalogEntry):void{
    if(this.entries.has(entry.action)) throw new Error(`Command already registered: ${entry.action}`);
    this.entries.set(entry.action,structuredClone(entry));
  }

  resolve(intent:CommandIntent):CommandCatalogEntry{
    const entry=this.entries.get(intent.action);
    if(!entry) throw new Error(`Unknown command action: ${intent.action}`);
    if(entry.requiresTarget && !intent.targetId) throw new Error(`Command ${intent.action} requires a target`);
    return structuredClone(entry);
  }

  list():CommandCatalogEntry[]{
    return structuredClone([...this.entries.values()]);
  }
}

export interface CommandFactoryContext {
  commandId:string;
  actor:Command["actor"];
  scope:Command["scope"];
  correlationId:string;
  idempotencyKey:string;
}

export function intentToCommand(intent:CommandIntent,ctx:CommandFactoryContext):Command{
  return {
    commandId:ctx.commandId,
    action:intent.action,
    actor:ctx.actor,
    scope:ctx.scope,
    target:intent.targetId && intent.targetType
      ? {entityType:intent.targetType as Command["target"] extends infer T ? any : never,entityId:intent.targetId}
      : undefined,
    payload:intent.arguments,
    idempotencyKey:ctx.idempotencyKey,
    correlationId:ctx.correlationId
  };
}
