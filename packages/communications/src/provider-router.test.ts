import test from "node:test";
import assert from "node:assert/strict";
import { ProviderRouter } from "./provider-router.js";
import type { ProviderAdapter } from "./index.js";

function provider(name:string,healthy:boolean,latencyMs:number):ProviderAdapter{
  return {
    channel:"sms",
    send:async()=>({providerMessageId:name,acceptedAt:new Date().toISOString()}),
    health:async()=>({healthy,latencyMs})
  };
}

test("provider router picks fastest healthy provider", async()=>{
  const router=new ProviderRouter([
    provider("slow",true,200),
    provider("fast",true,50),
    provider("dead",false,10)
  ]);
  const selected=await router.select("sms");
  const result=await selected.provider.send({
    tenantId:"t1",threadId:"th1",channel:"sms",direction:"outbound",
    sender:"+1",recipients:["+2"],body:"hi",metadata:{}
  });
  assert.equal(result.providerMessageId,"fast");
});
