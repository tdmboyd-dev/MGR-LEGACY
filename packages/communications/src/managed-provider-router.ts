import type { Channel, ProviderAdapter } from "./index.js";
import {
  ProviderCircuitBreaker,
  type ProviderHealthStore,
  type ProviderRoutingState
} from "./provider-health.js";

export interface ManagedProvider {
  key:string;
  adapter:ProviderAdapter;
  tenantId?:string;
  priority:number;
}

export class ManagedProviderRouter {
  private readonly breaker:ProviderCircuitBreaker;

  constructor(
    private readonly providers:ManagedProvider[],
    private readonly healthStore:ProviderHealthStore,
    failureThreshold=3,
    resetAfterMs=60_000
  ){
    this.breaker=new ProviderCircuitBreaker(failureThreshold,resetAfterMs);
  }

  private async stateFor(provider:ManagedProvider):Promise<ProviderRoutingState>{
    const existing=await this.healthStore.getState(
      provider.tenantId,
      provider.key,
      provider.adapter.channel
    );

    return existing ?? {
      tenantId:provider.tenantId,
      providerKey:provider.key,
      channel:provider.adapter.channel,
      priority:provider.priority,
      enabled:true,
      consecutiveFailures:0,
      circuitState:"closed",
      updatedAt:new Date().toISOString()
    };
  }

  async send(
    channel:Channel,
    message:Parameters<ProviderAdapter["send"]>[0]
  ):Promise<{providerKey:string;providerMessageId:string;acceptedAt:string}>{
    const candidates=this.providers
      .filter(item=>item.adapter.channel===channel)
      .sort((a,b)=>a.priority-b.priority);

    const failures:string[]=[];

    for(const candidate of candidates){
      let state=await this.stateFor(candidate);

      if(!this.breaker.canAttempt(state)) continue;

      if(state.circuitState==="open"){
        state=this.breaker.halfOpen(state);
        await this.healthStore.saveState(state);
      }

      const started=Date.now();

      try{
        const health=await candidate.adapter.health();
        const latencyMs=health.latencyMs ?? (Date.now()-started);

        await this.healthStore.record({
          tenantId:candidate.tenantId,
          providerKey:candidate.key,
          channel,
          healthy:health.healthy,
          latencyMs,
          failureCount:state.consecutiveFailures,
          details:health.details,
          observedAt:new Date().toISOString()
        });

        if(!health.healthy) throw new Error("Provider health check failed");

        const result=await candidate.adapter.send(message);
        await this.healthStore.saveState(this.breaker.onSuccess(state));

        return {
          providerKey:candidate.key,
          providerMessageId:result.providerMessageId,
          acceptedAt:result.acceptedAt
        };
      }catch(error){
        const next=this.breaker.onFailure(state);
        await this.healthStore.saveState(next);
        await this.healthStore.record({
          tenantId:candidate.tenantId,
          providerKey:candidate.key,
          channel,
          healthy:false,
          latencyMs:Date.now()-started,
          failureCount:next.consecutiveFailures,
          details:{error:error instanceof Error ? error.message : String(error)},
          observedAt:new Date().toISOString()
        });

        failures.push(candidate.key);
      }
    }

    throw new Error(
      failures.length
        ? `All providers failed for ${channel}: ${failures.join(", ")}`
        : `No provider available for ${channel}`
    );
  }
}
