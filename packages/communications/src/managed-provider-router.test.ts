import test from "node:test";
import assert from "node:assert/strict";
import { ManagedProviderRouter } from "./managed-provider-router.js";
import type { ProviderRoutingState, ProviderHealthSample } from "./provider-health.js";

test("managed router fails over and records provider health", async()=>{
  const states=new Map<string,ProviderRoutingState>();
  const samples:ProviderHealthSample[]=[];

  const store={
    record:async(sample:ProviderHealthSample)=>{samples.push(sample);},
    getState:async(_tenant:string|undefined,key:string)=>states.get(key) ?? null,
    saveState:async(state:ProviderRoutingState)=>{states.set(state.providerKey,state);}
  };

  const router=new ManagedProviderRouter([
    {
      key:"primary",
      priority:1,
      adapter:{
        channel:"sms",
        health:async()=>({healthy:false,latencyMs:5}),
        send:async()=>{throw new Error("primary unavailable");}
      }
    },
    {
      key:"backup",
      priority:2,
      adapter:{
        channel:"sms",
        health:async()=>({healthy:true,latencyMs:20}),
        send:async()=>({providerMessageId:"m1",acceptedAt:"2026-10-05T06:00:00.000Z"})
      }
    }
  ],store as any,2,1000);

  const result=await router.send("sms",{
    tenantId:"t1",
    threadId:"th1",
    channel:"sms",
    direction:"outbound",
    sender:"+1",
    recipients:["+2"],
    body:"hello",
    metadata:{}
  });

  assert.equal(result.providerKey,"backup");
  assert.ok(samples.some(row=>row.providerKey==="primary" && row.healthy===false));
  assert.ok(samples.some(row=>row.providerKey==="backup" && row.healthy===true));
});
