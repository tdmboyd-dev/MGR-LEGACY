import type { Channel, Message } from "./index.js";

export interface InboxThreadSummary {
  threadId:string;
  tenantId:string;
  contactIds:string[];
  subject?:string;
  channels:Channel[];
  lastMessageAt?:string;
  unreadCount:number;
  lastMessagePreview?:string;
}

export interface InboxRepository {
  listThreads(tenantId:string,ownerId?:string,limit?:number):Promise<InboxThreadSummary[]>;
  listMessages(tenantId:string,threadId:string,limit?:number):Promise<Message[]>;
  markRead(tenantId:string,threadId:string,actorId:string):Promise<void>;
}

export class UnifiedInboxService {
  constructor(private readonly repo:InboxRepository){}
  threads(tenantId:string,ownerId?:string,limit=100){ return this.repo.listThreads(tenantId,ownerId,limit); }
  messages(tenantId:string,threadId:string,limit=200){ return this.repo.listMessages(tenantId,threadId,limit); }
  markRead(tenantId:string,threadId:string,actorId:string){ return this.repo.markRead(tenantId,threadId,actorId); }
}

export interface IdentityCandidate {
  contactId:string;
  channel:Channel;
  address:string;
  verified:boolean;
  confidence:number;
}

export class ThreadIdentityResolver {
  resolve(address:string,channel:Channel,candidates:IdentityCandidate[]):IdentityCandidate|null{
    const normalized=channel==="email" ? address.trim().toLowerCase() : address.replace(/\D/g,"");
    return [...candidates]
      .filter(item=>item.channel===channel)
      .filter(item=>{
        const candidate=channel==="email"
          ? item.address.trim().toLowerCase()
          : item.address.replace(/\D/g,"");
        return candidate===normalized;
      })
      .sort((a,b)=>{
        if(a.verified!==b.verified) return a.verified?-1:1;
        return b.confidence-a.confidence;
      })[0] ?? null;
  }
}
