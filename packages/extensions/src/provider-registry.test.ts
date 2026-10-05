import test from "node:test";
import assert from "node:assert/strict";
import { ProviderRegistry } from "./provider-registry.js";

test("provider registry resolves highest priority matching provider",()=>{
  const registry=new ProviderRegistry();
  registry.register({id:"slow",channel:"sms",capabilities:["send"],secretRefs:[],enabled:true,priority:20});
  registry.register({id:"fast",channel:"sms",capabilities:["send"],secretRefs:[],enabled:true,priority:10});
  assert.equal(registry.resolve("sms","send")?.id,"fast");
});
