import type { ApprovalRequirement, PolicyRule } from "@mgr/legacy-contracts";

export interface PolicyContext {
  action: string;
  resourceType: string;
  actorRoles: string[];
  attributes?: Record<string, unknown>;
}

export interface PolicyDecision {
  allowed: boolean;
  matchedRuleIds: string[];
  approval: ApprovalRequirement;
  reason: string;
}

function conditionsMatch(rule: PolicyRule, context: PolicyContext): boolean {
  return Object.entries(rule.conditions).every(([key, expected]) => {
    if (key === "role") return context.actorRoles.includes(String(expected));
    return context.attributes?.[key] === expected;
  });
}

export class PolicyEngine {
  constructor(private readonly rules: PolicyRule[]) {}

  evaluate(context: PolicyContext): PolicyDecision {
    const matches = this.rules.filter(
      (rule) =>
        rule.action === context.action &&
        rule.resourceType === context.resourceType &&
        conditionsMatch(rule, context)
    );

    const explicitDeny = matches.find((rule) => rule.effect === "deny");
    if (explicitDeny) {
      return {
        allowed: false,
        matchedRuleIds: matches.map((rule) => rule.id),
        approval: { required: false, minimumApprovals: 0, approverRoles: [] },
        reason: `Denied by policy ${explicitDeny.id}`
      };
    }

    const allow = matches.find((rule) => rule.effect === "allow");
    if (!allow) {
      return {
        allowed: false,
        matchedRuleIds: [],
        approval: { required: false, minimumApprovals: 0, approverRoles: [] },
        reason: "Default deny: no allow policy matched"
      };
    }

    const highRisk = Boolean(context.attributes?.highRisk);
    return {
      allowed: true,
      matchedRuleIds: matches.map((rule) => rule.id),
      approval: highRisk
        ? {
            required: true,
            reason: "High-risk action requires human approval",
            minimumApprovals: 1,
            approverRoles: ["owner", "admin"]
          }
        : { required: false, minimumApprovals: 0, approverRoles: [] },
      reason: `Allowed by policy ${allow.id}`
    };
  }
}
