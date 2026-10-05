export type ContactStatus = "lead" | "prospect" | "customer" | "churned" | "archived";
export type OpportunityStatus = "open" | "won" | "lost" | "abandoned";
export type TaskStatus = "open" | "in_progress" | "blocked" | "done" | "cancelled";
export type BookingStatus = "tentative" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface Contact {
  id: string;
  tenantId: string;
  ownerId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyId?: string;
  status: ContactStatus;
  source?: string;
  tags: string[];
  score: number;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  tenantId: string;
  ownerId: string;
  name: string;
  website?: string;
  industry?: string;
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Pipeline {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  default: boolean;
}

export interface PipelineStage {
  id: string;
  tenantId: string;
  pipelineId: string;
  name: string;
  order: number;
  probability?: number;
}

export interface Opportunity {
  id: string;
  tenantId: string;
  ownerId: string;
  contactId?: string;
  companyId?: string;
  pipelineId: string;
  stageId: string;
  title: string;
  value: number;
  currency: string;
  status: OpportunityStatus;
  probability: number;
  expectedCloseAt?: string;
  closedAt?: string;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  tenantId: string;
  ownerId: string;
  subjectType: string;
  subjectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  tenantId: string;
  ownerId: string;
  contactId?: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  title: string;
  meetingUrl?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
