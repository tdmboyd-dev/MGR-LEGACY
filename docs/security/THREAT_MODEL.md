# MGR Legacy Threat Model

Updated: 2026-10-05

## Security objectives

MGR Legacy must preserve:
- tenant isolation
- least privilege
- deterministic authorization
- approval requirements
- idempotency
- immutable evidence/audit history
- secret confidentiality
- connector/provider containment
- safe autonomous execution
- reversible recovery where possible

## Primary threats and required controls

### Cross-tenant access
Threat: actor or query accesses another tenant's records.

Controls:
- tenant ID required at repository/API boundaries
- tenant predicates on persistent reads/writes
- actor/scope validation
- dedicated cross-tenant tests before production cutover

### Privilege escalation
Threat: agent, user, connector, or workflow performs an action outside its granted scope.

Controls:
- default deny
- Policy Compiler
- Approval Gateway
- Tool Map scopes
- Local Bridge explicit capability grants
- critical actions cannot graduate directly to autonomous execution

### Prompt injection / untrusted memory
Threat: external content attempts to alter authorization or system policy.

Controls:
- PrivacyIsolation trusted flag
- untrusted memory cannot influence authorization
- deterministic authorization occurs outside Jev/model reasoning
- external text is data, never executable policy

### Secret disclosure
Threat: credentials leak into source, logs, receipts, prompts, or connector manifests.

Controls:
- SecretRef stores references, not secret values
- provider manifests list required secret keys only
- scrub sensitive values from logs/evidence
- deployment secret store is authoritative

### Connector compromise
Threat: MCP/HTTP/local connector acts maliciously or is compromised.

Controls:
- connector capability declarations
- risk levels
- scoped registration
- Action Receipts
- provider health/circuit breakers
- exact-target rules for computer control
- sandbox/compatibility enforcement

### Workflow recursion/runaway automation
Threat: automation loops, fan-out, or retries create runaway cost/actions.

Controls:
- recursive-trigger detection
- FlowSpec invariants
- retry limits
- cost budgets
- checkpoints
- dead-letter handling
- execution traces
- Shadow Autopilot graduation gates

### Provider outage or inconsistent delivery
Threat: communication/model/media providers fail or partially succeed.

Controls:
- managed provider routing
- health persistence
- circuit breaker
- delivery telemetry
- idempotency keys
- provider evidence in Action Receipts

### Audit tampering / unverifiable actions
Threat: actions occur without reliable evidence.

Controls:
- event ledger
- audit entries
- Action Receipts
- correlation/causation IDs
- Truth Console
- rollback receipts

### Local computer misuse
Threat: desktop/browser bridge performs broad unintended actions.

Controls:
- least-privilege LocalBridge grants
- exact-target validation
- wildcard targets forbidden
- sensitive actions require policy/approval
- local capabilities independently grantable/revocable

## Production security gates

Before production cutover:
- cross-tenant tests
- authorization/approval tests
- secret scanning
- dependency vulnerability scan
- webhook signature verification where supported
- rate-limit/abuse controls for public endpoints
- backup/restore drill
- provider outage drill
- TEVV critical-risk suite
- manual review of autonomous capabilities
