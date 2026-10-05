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

function tenantId(req:IncomingMessage):string|undefined{
  const value=req.headers["x-tenant-id"];
  return Array.isArray(value)?value[0]:value;
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

      const tenant=tenantId(req);

      if(req.method==="POST" && url.pathname==="/v1/commands"){
        const body=await readJson(req);
        if(tenant && body && typeof body==="object" && !body.scope){
          body.metadata={...(body.metadata ?? {}),tenantId:body.metadata?.tenantId ?? tenant};
        }
        return json(res,200,await services.executeCommand(body));
      }

      if(req.method==="GET" && url.pathname==="/v1/today"){
        const ownerId=url.searchParams.get("ownerId");
        if(!ownerId) return json(res,400,{error:"ownerId is required"});
        return json(res,200,await services.today(ownerId,tenant ?? url.searchParams.get("tenantId") ?? undefined));
      }

      if(req.method==="POST" && url.pathname==="/v1/workflows/stage"){
        return json(res,201,await services.stageWorkflow(await readJson(req),tenant));
      }

      if(req.method==="POST" && url.pathname==="/v1/workflows/simulate"){
        const body=await readJson(req);
        return json(res,200,await services.simulateWorkflow(
          String(body.workflowId),Number(body.version),
          Array.isArray(body.eventIds)?body.eventIds.map(String):[],
          tenant
        ));
      }

      if(req.method==="POST" && url.pathname==="/v1/extensions"){
        return json(res,201,await services.installExtension(await readJson(req),tenant));
      }

      if(req.method==="GET" && url.pathname==="/v1/extensions"){
        return json(res,200,await services.listExtensions(tenant));
      }

      if(req.method==="POST" && url.pathname==="/v1/analytics/reports"){
        await services.saveReport(await readJson(req),tenant);
        return json(res,201,{ok:true});
      }

      if(req.method==="GET" && url.pathname==="/v1/analytics/reports"){
        return json(res,200,await services.listReports(tenant));
      }

      if(req.method==="POST" && url.pathname==="/v1/analytics/goals"){
        await services.saveGoal(await readJson(req),tenant);
        return json(res,201,{ok:true});
      }

      if(req.method==="GET" && url.pathname==="/v1/analytics/goals"){
        return json(res,200,await services.listGoals(
          tenant,
          url.searchParams.get("scopeType") ?? undefined,
          url.searchParams.get("scopeId") ?? undefined
        ));
      }

      if(req.method==="GET" && url.pathname==="/v1/analytics/series"){
        const metricKey=url.searchParams.get("metricKey");
        if(!metricKey) return json(res,400,{error:"metricKey is required"});
        return json(res,200,await services.metricSeries({
          metricKey,
          from:url.searchParams.get("from") ?? undefined,
          to:url.searchParams.get("to") ?? undefined,
          scopeType:url.searchParams.get("scopeType") ?? undefined,
          scopeId:url.searchParams.get("scopeId") ?? undefined
        },tenant));
      }

      if(req.method==="POST" && url.pathname==="/v1/tax/required-documents"){
        await services.saveTaxRequiredDocuments(await readJson(req),tenant);
        return json(res,201,{ok:true});
      }

      if(req.method==="POST" && url.pathname==="/v1/tax/returns"){
        await services.saveTaxReturn(await readJson(req),tenant);
        return json(res,201,{ok:true});
      }

      if(req.method==="POST" && url.pathname==="/v1/tax/signatures"){
        await services.saveTaxSignature(await readJson(req),tenant);
        return json(res,201,{ok:true});
      }

      if(req.method==="POST" && url.pathname==="/v1/tax/bank-products"){
        await services.saveTaxBankProduct(await readJson(req),tenant);
        return json(res,201,{ok:true});
      }

      if(req.method==="POST" && url.pathname==="/v1/tax/credentials"){
        await services.saveTaxCredential(await readJson(req),tenant);
        return json(res,201,{ok:true});
      }

      if(req.method==="POST" && url.pathname==="/v1/tax/portal-requests"){
        await services.createTaxPortalRequest(await readJson(req),tenant);
        return json(res,201,{ok:true});
      }

      if(req.method==="GET" && url.pathname==="/v1/truth/receipts"){
        const status=url.searchParams.get("status") ?? undefined;
        return json(res,200,await services.listActionReceipts({
          correlationId:url.searchParams.get("correlationId") ?? undefined,
          actorId:url.searchParams.get("actorId") ?? undefined,
          action:url.searchParams.get("action") ?? undefined,
          status:status as any,
          limit:url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined
        },tenant));
      }

      if(req.method==="GET" && url.pathname==="/v1/truth/console"){
        const status=url.searchParams.get("status") ?? undefined;
        return json(res,200,await services.truthConsole({
          correlationId:url.searchParams.get("correlationId") ?? undefined,
          actorId:url.searchParams.get("actorId") ?? undefined,
          action:url.searchParams.get("action") ?? undefined,
          status:status as any,
          limit:url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined
        },tenant));
      }

      if(req.method==="GET" && url.pathname==="/v1/truth/summary"){
        const status=url.searchParams.get("status") ?? undefined;
        return json(res,200,await services.truthSummary({
          correlationId:url.searchParams.get("correlationId") ?? undefined,
          actorId:url.searchParams.get("actorId") ?? undefined,
          action:url.searchParams.get("action") ?? undefined,
          status:status as any,
          limit:url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined
        },tenant));
      }

      const webhookMatch=url.pathname.match(/^\/v1\/extensions\/([^/]+)\/webhooks$/);
      if(req.method==="POST" && webhookMatch){
        const body=await readJson(req);
        return json(res,201,await services.registerWebhook(
          decodeURIComponent(webhookMatch[1]!),String(body.eventType),String(body.url),tenant
        ));
      }

      return json(res,404,{error:"Not found"});
    }catch(error){
      return json(res,500,{error:error instanceof Error?error.message:String(error)});
    }
  });
}
