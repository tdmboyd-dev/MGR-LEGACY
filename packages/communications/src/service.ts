import { randomUUID } from "node:crypto";
import type { Channel, ConsentRecord, Message, ProviderAdapter } from "./index.js";
import { ConsentGuard } from "./index.js";

export interface ConsentRepository {
  get(tenantId:string,contactId:string,channel:Channel):Promise<ConsentRecord|null>;
}

export interface MessageRepository {
  save(message:Message):Promise<Message>;
}

export interface CommunicationSendInput {
  tenantId:string;
  threadId:string;
  contactId:string;
  channel:Channel;
  sender:string;
  recipients:string[];
  body:string;
  metadata?:Record<string,unknown>;
}

export class CommunicationService {
  private readonly guard=new ConsentGuard();

  constructor(
    private readonly consent:ConsentRepository,
    private readonly messages:MessageRepository,
    private readonly providers:ProviderAdapter[]
  ) {}

  private provider(channel:Channel):ProviderAdapter {
    const provider=this.providers.find(item=>item.channel===channel);
    if(!provider) throw new Error(`No provider configured for ${channel}`);
    return provider;
  }

  async send(input:CommunicationSendInput):Promise<Message> {
    const consent=await this.consent.get(input.tenantId,input.contactId,input.channel);
    const decision=this.guard.canSend(consent);
    if(!decision.allowed) throw new Error(`Send blocked: ${decision.reason}`);

    const draft:Omit<Message,"id"|"sentAt">={
      tenantId:input.tenantId,
      threadId:input.threadId,
      channel:input.channel,
      direction:"outbound",
      sender:input.sender,
      recipients:input.recipients,
      body:input.body,
      metadata:input.metadata ?? {}
    };

    const result=await this.provider(input.channel).send(draft);
    const message:Message={
      ...draft,
      id:randomUUID(),
      sentAt:result.acceptedAt,
      metadata:{...draft.metadata,providerMessageId:result.providerMessageId}
    };

    return this.messages.save(message);
  }
}
