export type Channel = "email" | "sms" | "voice" | "chat" | "portal";

export interface CommunicationIdentity {
  tenantId: string;
  contactId: string;
  channel: Channel;
  address: string;
  verified: boolean;
}

export interface Message {
  id: string;
  tenantId: string;
  threadId: string;
  channel: Channel;
  direction: "inbound" | "outbound";
  sender: string;
  recipients: string[];
  body: string;
  sentAt: string;
  metadata: Record<string, unknown>;
}

export interface ConversationThread {
  id: string;
  tenantId: string;
  contactIds: string[];
  subject?: string;
  channels: Channel[];
  messageIds: string[];
  lastActivityAt?: string;
}

export interface ConsentRecord {
  tenantId: string;
  contactId: string;
  channel: Channel;
  status: "granted" | "revoked" | "unknown";
  source: string;
  updatedAt: string;
  quietHours?: { start: string; end: string; timezone: string };
}

export class ConsentGuard {
  canSend(record: ConsentRecord | null,now=new Date()): { allowed: boolean; reason?: string } {
    if (!record) return { allowed: false, reason: "No consent record" };
    if (record.status !== "granted") return { allowed: false, reason: `Consent is ${record.status}` };
    if(record.quietHours){
      const {start,end,timezone}=record.quietHours;
      const minutes=(value:string)=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))throw Error("Invalid quiet hours");const [h,m]=value.split(":").map(Number);return h!*60+m!;};
      try{
        const parts=new Intl.DateTimeFormat("en-GB",{timeZone:timezone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now);
        const current=Number(parts.find(p=>p.type==="hour")?.value)*60+Number(parts.find(p=>p.type==="minute")?.value);
        const from=minutes(start),to=minutes(end);
        const quiet=from===to || (from<to?current>=from&&current<to:current>=from||current<to);
        if(quiet)return {allowed:false,reason:"Quiet hours"};
      }catch{return {allowed:false,reason:"Invalid quiet hours configuration"};}
    }
    return { allowed: true };
  }
}

export interface ProviderAdapter {
  channel: Channel;
  send(message: Omit<Message, "id" | "sentAt">): Promise<{ providerMessageId: string; acceptedAt: string }>;
  health(): Promise<{ healthy: boolean; latencyMs?: number; details?: Record<string, unknown> }>;
}

export * from "./service.js";
export * from "./comms-command.js";
export * from "./provider-router.js";

export * from "./provider-health.js";
export * from "./managed-provider-router.js";
export * from "./inbox.js";
export * from "./templates-sequences.js";
export * from "./policies-telemetry.js";
export * from "./http-provider-adapters.js";
