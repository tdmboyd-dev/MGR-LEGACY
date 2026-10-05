# MGR Legacy — Build List

Updated: 2026-10-05

## Gate 0 — Source-of-truth migration
- [x] Create MGR-LEGACY repository
- [x] Map MGR Agents CRM assets
- [x] Map MGR Elite Hub CRM/tax/bureau assets
- [x] Define canonical shared architecture
- [x] Define MGR-native systems
- [x] Reclaim known Floot-assigned scope directly into MGR Legacy
- [x] Remove Floot from the product completion critical path
- [x] Preserve Floot provenance and optional future salvage rules

## Gate 1 — Contracts
- [x] tenant/hierarchy contracts
- [x] identity/entity graph
- [x] objects/fields
- [x] events
- [x] activities/timeline
- [x] pipelines/opportunities
- [x] tasks/cases/bookings
- [x] workflows
- [x] communications
- [x] permissions/approvals
- [x] analytics metrics
- [x] agent/tool actions
- [x] extension manifests

## Gate 2 — Core data plane
- [x] organizations/workspaces/hierarchy
- [x] customer graph
- [x] Object Forge registry
- [x] event ledger
- [x] activity/case persistence
- [x] ownership/assignment
- [x] consent/preferences
- [x] audit/outbox/idempotency
- [x] schema lifecycle / governance repositories
- [x] real PostgreSQL clean-database integration verification
- [ ] upgrade-path verification from earlier schema states
- [ ] dedicated tenant-isolation integration tests

## Gate 3 — Core CRM/work
- [x] contacts
- [x] companies
- [x] pipelines/stages
- [x] opportunities
- [x] activities/cases
- [x] bookings
- [x] tasks
- [x] CRM command handlers
- [x] import/export/bulk/merge planning
- [x] Postgres repositories
- [ ] live MGR Agents parity/backfill/cutover proof

## Gate 4 — Workflow runtime
- [x] triggers/conditions/actions
- [x] scheduling/waits
- [x] subflows
- [x] retries
- [x] approvals
- [x] versioning/staging/activation
- [x] replay/checkpoints
- [x] simulation
- [x] conflict detector
- [x] self-audit/health
- [x] execution trace
- [x] durable runner/resume worker
- [ ] deployed worker/queue soak and recovery tests

## Gate 5 — Communications
- [x] unified inbox/thread model
- [x] provider-independent email/SMS/voice adapters
- [x] templates/sequences
- [x] consent enforcement
- [x] quiet-hour/policy helpers
- [x] provider health/circuit breaker
- [x] health-aware managed routing/failover
- [x] delivery persistence/telemetry
- [x] Comms Command
- [ ] real provider credentials + sandbox/live integration proof
- [ ] real callback/delivery/failover tests

## Gate 6 — Intelligence
- [x] Signal Graph
- [x] TODAY/Next Action
- [x] Revenue Leak Scanner
- [x] Forecast Brain
- [x] Deal Coach
- [x] Service Brain
- [x] Growth Loop
- [x] Data Medic/reversible repair planning
- [x] evidence and production-source interfaces
- [ ] validate all production-source adapters against live MGR data

## Gate 7 — Analytics
- [x] semantic metric layer
- [x] reports
- [x] attribution
- [x] cohorts
- [x] funnel/lifecycle
- [x] hierarchy rollups
- [x] goals
- [x] automation ROI
- [x] agent contribution
- [x] data-health reporting
- [x] persistent report/goal/metric-series API
- [ ] production data validation and performance/load proof

## Gate 8 — Tax & Service Bureau Pack
- [x] bureau hierarchy/domain contracts
- [x] preparer/office concepts
- [x] tax client lifecycle
- [x] client portal bridge contracts
- [x] document chase
- [x] return/signature states
- [x] bank-product lifecycle
- [x] fee/split/commission/reconciliation
- [x] credential/compliance status
- [x] bureau analytics
- [x] tax workflows/events
- [x] activation/health engine
- [x] persistent tax repositories/API
- [ ] real Elite Hub backfill/dual-write/cutover proof
- [ ] live vertical integration verification

## Gate 9 — Extension Foundry
- [x] SDK
- [x] webhooks/events
- [x] manifests/scopes
- [x] workflow-node runtime
- [x] provider/UI contracts
- [x] runtime/registration lifecycle
- [x] sandbox/version compatibility enforcement
- [x] persistent extension registration
- [ ] security/threat-model and live webhook/runtime integration tests

## Gate 10 — Consumer integrations

### MGR Agents
- [x] source mapping/adoption helpers
- [x] backfill/dual-write/reconciliation/cutover/rollback machinery
- [ ] connect actual MGR Agents CRM/tool paths
- [ ] run real backfill + reconciliation
- [ ] cut reads/writes after parity
- [ ] retire duplicate authoritative CRM only after rollback window

### MGR Elite Hub
- [x] source mapping/adoption helpers
- [x] tax pack/shared-layer cutover machinery
- [ ] connect actual Elite Hub shared CRM/workflow/comms/analytics paths
- [ ] run real backfill + reconciliation
- [ ] cut reads/writes after parity
- [ ] retire duplicate authoritative CRM only after rollback window

## Gate 11 — Production verification/hardening
- [x] Node 22 dependency install verification
- [x] TypeScript typecheck
- [x] current unit test suite
- [x] branch parity check at verified checkpoint
- [x] PostgreSQL integration smoke against PostgreSQL 16
- [ ] API integration tests
- [ ] end-to-end tests
- [ ] tenant/permission isolation tests
- [ ] migration/upgrade/reconciliation tests
- [ ] real provider failure/failover tests
- [ ] backup/restore drill
- [ ] observability/alerting validation
- [ ] load/performance/concurrency tests
- [ ] security review
- [x] deployment and disaster-recovery runbooks

## Current verdict

Core platform implementation is substantially built and CI-green, but production completion is still blocked by live-system adoption and production-grade integration/hardening evidence. See `docs/build/REMAINING_WORK.md` for the exact remaining work.


## Gate 12 — MGR API/MCP shared edge integration
- [x] Locate and audit `tdmboyd-dev/MGR-API-MCP`
- [x] Define service boundary: API-MCP=edge/Brain, Legacy=business system of record, Creation OS=creation engine
- [x] Document anti-duplication rules and integration contract
- [x] add typed Legacy client inside MGR-API-MCP
- [x] add tenant/actor/correlation/idempotency propagation in the Legacy client
- [x] bind that context directly to verified MCP HTTP authentication so callers cannot spoof identity
- [x] convert side-effecting MCP tools into governed Legacy capability calls
- [x] return Legacy Action Receipt IDs/evidence through MCP responses
- [x] back MCP tool discovery with Legacy capability/connector registries
- [x] route creation-domain capabilities to Creation OS rather than duplicating execution
- [ ] add cross-boundary restart/idempotency/reconciliation tests
- [ ] complete remote MCP auth integration and hosted ChatGPT MCP verification
