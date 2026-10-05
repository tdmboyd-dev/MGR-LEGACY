export interface ExtensionInstallRequest {
  manifest:Record<string,unknown>;
  enabled:boolean;
}

export interface ExtensionApiTransport {
  request<T>(method:"GET"|"POST"|"PATCH"|"DELETE",path:string,body?:unknown):Promise<T>;
}

export class LegacyExtensionClient {
  constructor(private readonly transport:ExtensionApiTransport){}

  install(input:ExtensionInstallRequest):Promise<{id:string;version:string}>{
    return this.transport.request("POST","/v1/extensions",input);
  }

  list():Promise<Array<{id:string;version:string;status:string}>>{
    return this.transport.request("GET","/v1/extensions");
  }

  registerWebhook(extensionId:string,eventType:string,url:string):Promise<{subscriptionId:string}>{
    return this.transport.request("POST",`/v1/extensions/${encodeURIComponent(extensionId)}/webhooks`,{
      eventType,url
    });
  }
}
