import type { IncomingMessage } from "node:http";
import type { ApiAuthConfig } from "./types.js";

export function authorize(req:IncomingMessage,config:ApiAuthConfig):boolean{
  if(!config.bearerToken) return true;
  const header=req.headers.authorization;
  if(!header?.startsWith("Bearer ")) return false;
  return header.slice("Bearer ".length)===config.bearerToken;
}
