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
  canSend(record: ConsentRecord | null): { allowed: boolean; reason?: string } {
    if (!record) return { allowed: false, reason: "No consent record" };
    if (record.status !== "granted") return { allowed: false, reason: `Consent is ${record.status}` };
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
