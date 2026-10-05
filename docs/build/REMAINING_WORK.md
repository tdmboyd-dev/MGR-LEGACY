# MGR Legacy — Exact Remaining Work

Updated: 2026-10-05

Current repository state:
- main and staging/legacy-foundation synchronized
- 12 implementation packages
- 7 PostgreSQL migrations
- 25 test files
- 173 tracked files

## Remaining major completion blocks

### 1. Core data plane completion
- persistent activity timeline
- persistent ownership/assignment service
- consent/preference service completion
- object schema persistence/version lifecycle
- audit-query/read APIs
- data retention/archive rules
- tenant isolation tests

### 2. CRM/work completion
- activities service
- cases/tickets
- agent-facing CRM action handlers
- import/export framework
- bulk operations
- merge/dedup flows
- CRM reconciliation tests

### 3. Workflow engine completion
- condition evaluation
- scheduling/waits
- parallel branches
- subflows
- approvals inside workflows
- durable resume execution wiring
- persistent checkpoint/replay integration
- reliable outbox delivery persistence
- workflow execution trace query APIs
- workflow version activation safety integration

### 4. Communications completion
- unified inbox service
- thread identity resolution
- concrete email adapter
- concrete SMS adapter
- concrete voice/call adapter
- templates/snippets
- sequences/cadences
- provider-health-aware managed routing
- quiet-hour enforcement
- deliverability telemetry
- Comms Command execution wiring

### 5. Intelligence completion
- TODAY source aggregation across every operational domain
- Signal Graph persistence/query APIs
- Revenue Leak Scanner production sources
- Forecast Brain production data wiring
- Deal Coach production wiring
- Service Brain production wiring
- Growth Loop production wiring
- Data Medic repair plans + reversible fixes
- Universal Command execution path
- explanation/evidence surfaces

### 6. Analytics completion
- dashboards/report query layer
- cohort analytics
- lifecycle/funnel analytics
- hierarchy rollups wired to real metrics
- goals/quotas
- forecasting dashboards
- automation ROI
- agent contribution metrics
- data-quality health reporting

### 7. Tax & Service Bureau Pack completion
- client portal bridge
- document chase
- return lifecycle events
- signature/Form 8879 integration hooks
- bank-product lifecycle
- fee/split/commission/reconciliation
- credential/compliance status
- bureau/office/preparer analytics
- tax-specific workflow nodes
- office activation/health production wiring

### 8. Extension Foundry completion
- webhook/event subscription runtime
- extension SDK completion
- app/pack registration lifecycle
- custom workflow-node runtime
- provider adapter registration
- vertical-pack registry
- UI extension contracts
- sandbox/version compatibility enforcement

### 9. MGR Agents live adoption
- Legacy SDK adapter behind current CRM tools
- dual-write
- historical backfill
- reconciliation telemetry
- agent identity/audit propagation
- read cutover
- rollback
- duplicate CRM retirement only after parity

### 10. MGR Elite Hub live adoption
- customer graph mapping
- bureau/office/preparer hierarchy mapping
- tax pack registration
- shared communication/workflow/analytics cutover
- historical backfill
- dual-write + reconciliation
- read cutover
- rollback
- duplicate CRM retirement only after parity

### 11. Floot recovery/reconciliation
- import MGR Sales Dashboard under legacy-import/floot/
- compare imported code/research against canonical contracts
- mine reusable code
- preserve provenance
- never let Floot overwrite canonical architecture

This block depends on Floot being readable; it is not a blocker for continuing Legacy implementation.

### 12. Production verification and hardening
- complete unit tests
- integration tests
- end-to-end tests
- tenant/permission isolation tests
- migration/reconciliation tests
- workflow retry/replay tests
- provider failure/failover tests
- data import/export tests
- audit completeness tests
- observability/logging/metrics
- backup/recovery plan
- load/performance tests
- security review
- one deliberate CI verification batch
- final staging-to-main parity check

## Definition of complete
MGR Legacy is complete only when:
1. shared core capabilities are persistent and production-safe,
2. MGR Agents and Elite Hub consume Legacy without duplicate authoritative CRM truth,
3. Tax Pack works as a vertical extension rather than contaminating core,
4. workflows are durable, replayable, observable, and governed,
5. communications are provider-independent and failover-safe,
6. native intelligence systems operate on real production data,
7. migrations reconcile without unexplained data loss,
8. tests and operational hardening pass,
9. main is current and AI handoff/source-of-truth docs are accurate.
