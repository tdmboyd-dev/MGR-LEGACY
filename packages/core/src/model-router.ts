export interface ModelRoute {
  provider:string;
  model:string;
  capability:string;
  maxCostPerMillionInput?:number;
  maxCostPerMillionOutput?:number;
  latencyClass?:"fast"|"balanced"|"deep";
  dataPolicy?:"local"|"private"|"standard";
  enabled:boolean;
}

export interface ModelRequestProfile {
  capability:string;
  latencyClass:"fast"|"balanced"|"deep";
  maxEstimatedCost?:number;
  dataPolicy:"local"|"private"|"standard";
}

export class ModelCostRouter {
  choose(routes:ModelRoute[],request:ModelRequestProfile):ModelRoute|null{
    const eligible=routes.filter(route=>
      route.enabled &&
      route.capability===request.capability &&
      (!route.dataPolicy || route.dataPolicy===request.dataPolicy) &&
      (!route.latencyClass || route.latencyClass===request.latencyClass)
    );
    return [...eligible].sort((a,b)=>{
      const ac=(a.maxCostPerMillionInput ?? Infinity)+(a.maxCostPerMillionOutput ?? Infinity);
      const bc=(b.maxCostPerMillionInput ?? Infinity)+(b.maxCostPerMillionOutput ?? Infinity);
      return ac-bc;
    })[0] ?? null;
  }
}
