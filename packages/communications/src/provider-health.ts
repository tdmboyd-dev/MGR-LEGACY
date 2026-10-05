import type { Channel } from "./index.js";

export type CircuitState="closed"|"open"|"half_open";

export interface ProviderHealthSample {
  tenantId?:string;
  providerKey:string;
  channel:Channel;
  healthy:boolean;
  latencyMs?:number;
  failureCount:number;
  details?:Record<string,unknown>;
  observedAt:string;
}

export interface ProviderRoutingState {
  tenantId?:string;
  providerKey:string;
  channel:Channel;
  priority:number;
  enabled:boolean;
  consecutiveFailures:number;
  circuitState:CircuitState;
  openedAt?:string;
  updatedAt:string;
}

export interface ProviderHealthStore {
  record(sample:ProviderHealthSample):Promise<void>;
  getState(tenantId:string|undefined,providerKey:string,channel:Channel):Promise<ProviderRoutingState|null>;
  saveState(state:ProviderRoutingState):Promise<void>;
}

export class ProviderCircuitBreaker {
  constructor(
    private readonly failureThreshold=3,
    private readonly resetAfterMs=60_000
  ) {}

  onSuccess(state:ProviderRoutingState,now=new Date()):ProviderRoutingState{
    return {
      ...state,
      consecutiveFailures:0,
      circuitState:"closed",
      openedAt:undefined,
      updatedAt:now.toISOString()
    };
  }

  onFailure(state:ProviderRoutingState,now=new Date()):ProviderRoutingState{
    const failures=state.consecutiveFailures+1;
    const shouldOpen=failures>=this.failureThreshold;

    return {
      ...state,
      consecutiveFailures:failures,
      circuitState:shouldOpen ? "open" : state.circuitState,
      openedAt:shouldOpen ? now.toISOString() : state.openedAt,
      updatedAt:now.toISOString()
    };
  }

  canAttempt(state:ProviderRoutingState,now=new Date()):boolean{
    if(!state.enabled) return false;
    if(state.circuitState==="closed") return true;
    if(state.circuitState==="half_open") return true;
    if(!state.openedAt) return false;

    const elapsed=now.getTime()-new Date(state.openedAt).getTime();
    return elapsed>=this.resetAfterMs;
  }

  halfOpen(state:ProviderRoutingState,now=new Date()):ProviderRoutingState{
    return {
      ...state,
      circuitState:"half_open",
      updatedAt:now.toISOString()
    };
  }
}
