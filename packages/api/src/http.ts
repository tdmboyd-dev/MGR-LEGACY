import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { authorize } from "./auth.js";
import type { ApiAuthConfig, LegacyApiServices } from "./types.js";

async function readJson(req:IncomingMessage):Promise<any>{
  const chunks:Buffer[]=[];
  for await(const chunk of req) chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));
  if(!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function json(res:ServerResponse,status:number,body:unknown):void{
  res.statusCode=status;
  res.setHeader("content-type","application/json");
  res.end(JSON.stringify(body));
}

export function createLegacyServer(
  services:LegacyApiServices,
  auth:ApiAuthConfig={}
){
  return createServer(async(req,res)=>{
    try{
      const url=new URL(req.url ?? "/","http://legacy.local");

      if(req.method==="GET" && url.pathname==="/health"){
        const health=await services.health();
        return json(res,200,{ok:true,...health});
      }

      if(!authorize(req,auth)) return json(res,401,{error:"Unauthorized"});

      if(req.method==="POST" && url.pathname==="/v1/commands"){
        return json(res,200,await services.executeCommand(await readJson(req)));
      }

      if(req.method==="GET" && url.pathname==="/v1/today"){
        const ownerId=url.searchParams.get("ownerId");
        if(!ownerId) return json(res,400,{error:"ownerId is required"});
        return json(res,200,await services.today(ownerId,url.searchParams.get("tenantId") ?? undefined));
      }

      if(req.method==="POST" && url.pathname==="/v1/workflows/stage"){
        return json(res,201,await services.stageWorkflow(await readJson(req)));
      }

      if(req.method==="POST" && url.pathname==="/v1/workflows/simulate"){
        const body=await readJson(req);
        return json(res,200,await services.simulateWorkflow(
          String(body.workflowId),Number(body.version),Array.isArray(body.eventIds)?body.eventIds.map(String):[]
        ));
      }

      if(req.method==="POST" && url.pathname==="/v1/extensions"){
        return json(res,201,await services.installExtension(await readJson(req)));
      }

      if(req.method==="GET" && url.pathname==="/v1/extensions"){
        return json(res,200,await services.listExtensions());
      }

      const webhookMatch=url.pathname.match(/^\/v1\/extensions\/([^/]+)\/webhooks$/);
      if(req.method==="POST" && webhookMatch){
        const body=await readJson(req);
        return json(res,201,await services.registerWebhook(
          decodeURIComponent(webhookMatch[1]!),String(body.eventType),String(body.url)
        ));
      }

      return json(res,404,{error:"Not found"});
    }catch(error){
      return json(res,500,{error:error instanceof Error?error.message:String(error)});
    }
  });
}
