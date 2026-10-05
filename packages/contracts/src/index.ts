import { z } from "zod";

export const IdSchema = z.string().min(1);
export type Id = z.infer<typeof IdSchema>;

export const ScopeTypeSchema = z.enum([
  "organization",
  "workspace",
  "bureau",
  "office",
  "team",
  "user",
  "agent"
]);
export type ScopeType = z.infer<typeof ScopeTypeSchema>;

export const TenantScopeSchema = z.object({
  tenantId: IdSchema,
  scopeType: ScopeTypeSchema,
  scopeId: IdSchema
});
export type TenantScope = z.infer<typeof TenantScopeSchema>;

export const ActorSchema = z.object({
  actorType: z.enum(["user", "agent", "service"]),
  actorId: IdSchema,
  tenantId: IdSchema,
  impersonatedBy: IdSchema.optional()
});
export type Actor = z.infer<typeof ActorSchema>;

export const EntityTypeSchema = z.enum([
  "person",
  "household",
  "company",
  "organization",
  "opportunity",
  "case",
  "task",
  "booking",
  "custom"
]);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const EntityRefSchema = z.object({
  entityType: EntityTypeSchema,
  entityId: IdSchema
});
export type EntityRef = z.infer<typeof EntityRefSchema>;

export const RelationshipSchema = z.object({
  id: IdSchema,
  tenantId: IdSchema,
  from: EntityRefSchema,
  to: EntityRefSchema,
  relationshipType: z.string().min(1),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).default({})
});
export type Relationship = z.infer<typeof RelationshipSchema>;

export const LegacyEventSchema = z.object({
  eventId: IdSchema,
  eventType: z.string().min(1),
  eventVersion: z.number().int().positive(),
  occurredAt: z.string().datetime(),
  actor: ActorSchema,
  scope: TenantScopeSchema,
  subject: EntityRefSchema,
  source: z.string().min(1),
  correlationId: IdSchema,
  causationId: IdSchema.optional(),
  idempotencyKey: z.string().min(1),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  data: z.record(z.string(), z.unknown()).default({}),
  evidence: z.record(z.string(), z.unknown()).default({})
});
export type LegacyEvent = z.infer<typeof LegacyEventSchema>;

export const PermissionEffectSchema = z.enum(["allow", "deny"]);
export type PermissionEffect = z.infer<typeof PermissionEffectSchema>;

export const PolicyRuleSchema = z.object({
  id: IdSchema,
  effect: PermissionEffectSchema,
  action: z.string().min(1),
  resourceType: z.string().min(1),
  conditions: z.record(z.string(), z.unknown()).default({})
});
export type PolicyRule = z.infer<typeof PolicyRuleSchema>;

export const ApprovalRequirementSchema = z.object({
  required: z.boolean(),
  reason: z.string().optional(),
  minimumApprovals: z.number().int().nonnegative().default(0),
  approverRoles: z.array(z.string()).default([])
});
export type ApprovalRequirement = z.infer<typeof ApprovalRequirementSchema>;

export const CommandSchema = z.object({
  commandId: IdSchema,
  action: z.string().min(1),
  actor: ActorSchema,
  scope: TenantScopeSchema,
  target: EntityRefSchema.optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().min(1),
  correlationId: IdSchema
});
export type Command = z.infer<typeof CommandSchema>;

export const NextActionSchema = z.object({
  id: IdSchema,
  tenantId: IdSchema,
  ownerId: IdSchema,
  subject: EntityRefSchema,
  title: z.string().min(1),
  reason: z.string().min(1),
  recommendedCommand: CommandSchema.optional(),
  urgency: z.number().min(0).max(1),
  businessValue: z.number().min(0).max(1),
  risk: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  effort: z.number().min(0).max(1),
  dueAt: z.string().datetime().optional(),
  blockers: z.array(z.string()).default([])
});
export type NextAction = z.infer<typeof NextActionSchema>;

export const WorkflowDefinitionSchema = z.object({
  workflowId: IdSchema,
  version: z.number().int().positive(),
  name: z.string().min(1),
  status: z.enum(["draft", "staged", "active", "retired"]),
  trigger: z.object({
    type: z.enum(["event", "schedule", "webhook", "manual"]),
    config: z.record(z.string(), z.unknown())
  }),
  nodes: z.array(z.object({
    nodeId: IdSchema,
    type: z.string().min(1),
    config: z.record(z.string(), z.unknown())
  })),
  edges: z.array(z.object({
    from: IdSchema,
    to: IdSchema,
    condition: z.record(z.string(), z.unknown()).optional()
  }))
});
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;
