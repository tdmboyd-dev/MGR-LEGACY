import {createHash} from "node:crypto";
import type {Command} from "@mgr/legacy-contracts";
/** Binds an idempotency key to the exact business request; transport IDs may change. */
export function commandRequestDigest(command:Pick<Command,"actor"|"scope"|"action"|"target"|"payload">):string{
 const stable=(value:unknown):unknown=>Array.isArray(value)?value.map(stable):value&&typeof value==="object"?Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])):value;
 return createHash("sha256").update(JSON.stringify(stable({actor:command.actor,scope:command.scope,action:command.action,target:command.target,payload:command.payload}))).digest("hex");
}
