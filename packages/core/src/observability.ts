export type LogLevel="debug"|"info"|"warn"|"error";

export interface StructuredLog {
  level:LogLevel;
  message:string;
  tenantId?:string;
  correlationId?:string;
  actorId?:string;
  component?:string;
  data:Record<string,unknown>;
  at:string;
}

export interface MetricSample {
  name:string;
  value:number;
  unit:"count"|"ms"|"bytes"|"ratio"|"currency";
  tenantId?:string;
  labels:Record<string,string>;
  at:string;
}

export interface ObservabilitySink {
  log(entry:StructuredLog):Promise<void>;
  metric(sample:MetricSample):Promise<void>;
}

export class Observability {
  constructor(private readonly sink:ObservabilitySink){}

  info(message:string,data:Record<string,unknown>={},context:Partial<StructuredLog>={}):Promise<void>{
    return this.sink.log({
      level:"info",message,data,at:new Date().toISOString(),
      tenantId:context.tenantId,correlationId:context.correlationId,
      actorId:context.actorId,component:context.component
    });
  }

  error(message:string,error:unknown,data:Record<string,unknown>={},context:Partial<StructuredLog>={}):Promise<void>{
    return this.sink.log({
      level:"error",message,
      data:{...data,error:error instanceof Error?error.message:String(error)},
      at:new Date().toISOString(),
      tenantId:context.tenantId,correlationId:context.correlationId,
      actorId:context.actorId,component:context.component
    });
  }

  timing(name:string,durationMs:number,labels:Record<string,string>={},tenantId?:string):Promise<void>{
    return this.sink.metric({name,value:durationMs,unit:"ms",tenantId,labels,at:new Date().toISOString()});
  }
}
