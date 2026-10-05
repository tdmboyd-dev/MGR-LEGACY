export interface ClientPortalRequest {
  id:string;
  tenantId:string;
  clientEntityId:string;
  type:"document"|"signature"|"payment"|"appointment"|"message";
  status:"open"|"completed"|"cancelled";
  title:string;
  dueAt?:string;
  metadata:Record<string,unknown>;
}

export interface ClientPortalBridge {
  createRequest(request:ClientPortalRequest):Promise<void>;
  listRequests(tenantId:string,clientEntityId:string):Promise<ClientPortalRequest[]>;
  completeRequest(id:string,metadata?:Record<string,unknown>):Promise<void>;
}

export class ClientPortalCoordinator {
  constructor(private readonly bridge:ClientPortalBridge){}

  requestDocument(input:Omit<ClientPortalRequest,"type"|"status">):Promise<void>{
    return this.bridge.createRequest({...input,type:"document",status:"open"});
  }

  requestSignature(input:Omit<ClientPortalRequest,"type"|"status">):Promise<void>{
    return this.bridge.createRequest({...input,type:"signature",status:"open"});
  }

  requestPayment(input:Omit<ClientPortalRequest,"type"|"status">):Promise<void>{
    return this.bridge.createRequest({...input,type:"payment",status:"open"});
  }
}
