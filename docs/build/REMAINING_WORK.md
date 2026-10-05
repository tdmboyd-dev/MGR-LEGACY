# MGR Legacy — Exact Remaining Work

Updated: 2026-10-05

## Current verified repository state

- `main` and `staging/legacy-foundation` were synchronized through the latest verified build checkpoint before this documentation refresh.
- 13 implementation packages.
- 17 PostgreSQL migrations (`0001` through `0017`).
- 25 test files.
- 212 tracked files in the current tree.
- 0 open GitHub issues.
- 0 TODO markers found by repository code search.
- 0 FIXME markers found by repository code search.
- Node 22 CI verification passed on commit `e4b2bea072b954aaa3d4fc1f3fd566fa54114ff8`:
  - dependency install passed
  - TypeScript typecheck passed
  - full `npm test` command passed
- Push-triggered CI was removed again after verification so normal pushes do not consume Actions minutes.

## What is implemented

### Shared core/data plane
- tenancy, hierarchy, actors, entities, relationships
- Object Forge definitions
- event ledger
- idempotency
- audit
- outbox
- activity/case persistence
- ownership/assignment
- preferences/schema lifecycle
- retention/audit repositories
- Postgres database adapter + migration runner
- API service/bootstrap layer

### CRM/work
- contacts, companies, pipelines, stages, opportunities, tasks, bookings
- activities/cases
- bulk/import-export/merge planning utilities
- persistent CRM repositories
- governed command ingress for core CRM mutations

### Workflow
- validation, simulation, runtime execution
- conditions, scheduling/waits
- approvals/subflows
- versioning/staging/activation
- retry policy
- persistent checkpoints/replay state
- durable runner
- resume worker
- execution traces
- conflict detection
- activation safeguards
- reliable outbox publisher

### Communications
- provider-independent send contracts
- consent enforcement
- unified inbox/thread helpers
- templates/sequences
- quiet-hour/policy/telemetry helpers
- HTTP provider adapters for email/SMS/voice channels
- provider health tracking
- circuit breaker
- managed health-aware failover routing
- persistent communication/delivery repositories
- Comms Command layer

### Intelligence
- Signal Graph
- Revenue Leak Scanner
- Forecast Brain
- Deal Coach
- Service Brain
- Growth Loop
- Data Medic + reversible repair planning
- evidence helpers
- production-source adapters
- operational TODAY inputs

### Analytics
- semantic metrics
- attribution
- reporting
- cohort/funnel analytics
- hierarchy rollups
- goals
- automation ROI
- agent contribution
- data-health reporting
- persistent reports/goals/metric-series access
- analytics API routes

### Tax & Service Bureau Pack
- bureau/office/preparer domain contracts
- tax client lifecycle
- document chase
- return/signature lifecycle
- bank-product lifecycle
- fees/splits/reconciliation
- credential readiness
- bureau analytics
- tax workflow nodes/events
- client portal bridge contracts
- persistent tax repositories
- tax API routes

### Extension Foundry
- manifests/scopes
- compatibility checks
- sandbox permission enforcement
- extension runtime
- custom workflow-node runtime
- UI/provider contracts
- persistent extension registration/webhooks
- SDK extension surface

### Adoption/cutover tooling
- MGR Agents source mappers
- MGR Elite Hub source mappers
- backfill utilities
- dual-write/cutover gates
- reconciliation telemetry
- rollback state
- cutover orchestration
- adoption persistence

## What is genuinely still left

The reclaimed operator/agent scope is now first-class: Action Receipts, Truth Console, FlowSpec, Shadow Autopilot, Jev decision fabric, Context Mesh, Tool Map, Policy Compiler, Local Bridge, realtime/mobile controls, Creation Factory, provider adapters, operator UI/renderers, agent memory/voice/perception/focus/subagents, playbooks, IntakeIQ, ClientPulse, RevenueRadar, and FlowGenius.


The codebase is feature-built and currently typecheck/test green, but it is **not yet 100% production-finished**. The remaining work is mostly production proof, live-system adoption, and operational hardening rather than missing core feature modules.

### 1. Production database verification
- [done] run all 17 migrations against a real clean PostgreSQL 16 database
- run upgrade-path migration tests from earlier schema states
- verify rollback/recovery procedures
- verify foreign keys/indexes/constraints with representative production-scale data
- [done] add real Postgres integration smoke covering migrations, command execution, Action Receipts, Truth summary, and idempotent replay

### 2. API integration and end-to-end verification
- add API package integration tests (currently no API package test files)
- boot the real API against PostgreSQL in test/staging
- exercise auth, tenant headers, command ingress, TODAY, workflow, extension, analytics, and tax routes end to end
- verify error mapping/status codes and malformed-input handling
- verify API restart/recovery behavior

### 3. Tenant/security hardening
- dedicated cross-tenant isolation tests
- permission/approval boundary tests against persisted state
- secrets/configuration review
- dependency/security review
- rate limiting / abuse controls where the deployed API requires them
- threat-model review for extension execution and webhooks

### 4. Real communications provider proof
- configure real provider credentials/endpoints for the chosen email/SMS/voice vendors
- execute sandbox/live provider sends
- verify callbacks/delivery receipts
- verify failover with actual provider failures
- verify quiet hours/consent against real delivery paths
- add provider-specific integration tests

### 5. Live MGR Agents adoption
The adapter/cutover machinery exists, but the actual MGR Agents repo has not been cut over.
- install/use Legacy SDK/API behind current CRM tools
- run historical backfill against real MGR Agents data
- run dual-write in a controlled environment
- compare reconciliation telemetry
- propagate real agent identity/audit context
- cut reads over only after parity
- exercise rollback
- retire duplicate CRM authority only after a proven rollback window

### 6. Live MGR Elite Hub adoption
The tax/Elite Hub mapping and cutover machinery exists, but the actual Elite Hub repo has not been cut over.
- map real customer/bureau/office/preparer records
- run historical backfill
- enable dual-write and reconciliation
- wire shared communications/workflow/analytics to Legacy
- prove Tax Pack integration against real Elite Hub flows
- cut reads over only after parity
- exercise rollback
- retire duplicate CRM authority only after a proven rollback window

### 7. Floot scope
The known Floot-assigned scope has been reclaimed directly into Legacy. Floot is not required for completion.
- `docs/build/FLOOT_RECLAIM_BUILD_QUEUE.md` is the canonical recovered-scope inventory
- any future Floot export is optional historical salvage/provenance only
- no product gate depends on Floot access

### 8. Operational production hardening
- observability validation in a deployed environment
- structured logs/metrics/alerts with real sinks
- backup and restore drill
- queue/worker deployment proof
- load/performance testing
- concurrency/race testing
- long-running workflow soak tests
- provider outage drills
- disaster-recovery runbook
- deployment/rollback runbook

### 9. Documentation/source-of-truth closure
- keep `HANDOFF.md`, `BUILD_LIST.md`, and this file synchronized with every production proof/cutover
- replace historical wording that says features are merely planned when they are already built
- record live-adoption evidence once MGR Agents and Elite Hub cutovers actually occur

## Definition of 100% complete

MGR Legacy is 100% complete only when all of the following are true:

1. all 17 migrations are proven against real PostgreSQL; upgrade paths from earlier schema states still require dedicated proof,
2. API/database integration and end-to-end tests pass,
3. tenant/security boundaries are explicitly tested,
4. real communication providers are proven including failover,
5. MGR Agents consumes Legacy as the authoritative shared CRM/action layer,
6. MGR Elite Hub consumes Legacy shared layers + Tax Pack with reconciled data,
7. rollback/backfill/reconciliation paths are proven,
8. backup/restore, observability, load, and security hardening are validated,
9. Floot remains optional historical salvage only and is not a completion gate,
10. source-of-truth docs match the deployed reality.

