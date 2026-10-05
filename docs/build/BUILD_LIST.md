# MGR Legacy — Build List

## Gate 0 — Source-of-truth migration
- [x] Create MGR-LEGACY repository
- [x] Map MGR Agents CRM assets
- [x] Map MGR Elite Hub CRM/tax/bureau assets
- [x] Define canonical shared architecture
- [x] Define MGR-native systems
- [ ] Copy complete Floot project into `legacy-import/floot/` (blocked only by current Floot daily action cap)
- [ ] Reconcile Floot research files against these canonical docs
- [ ] Preserve provenance for imported code; do not silently overwrite

## Gate 1 — Contracts first ✅
Create versioned contracts for:
- tenant/hierarchy
- identity/entity graph
- objects/fields
- events
- activities/timeline
- pipelines/opportunities
- tasks/cases/bookings
- workflows
- communications
- permissions/approvals
- analytics metrics
- agent/tool actions
- extension manifests

Acceptance:
- schemas validated
- IDs/scopes consistent
- events versioned
- idempotency keys defined
- audit requirements defined

## Gate 2 — Core data plane 🚧
Build:
- organizations/workspaces/hierarchy
- customer graph
- Object Forge registry
- event ledger
- activity timeline
- ownership
- consent/preferences
- audit ledger

## Gate 3 — Core CRM/work 🚧
Port/rebuild from MGR Agents:
- contacts
- companies
- pipelines/stages
- opportunities
- activities
- bookings
- tasks
- agent CRM actions
- import/export

## Gate 4 — Workflow runtime 🚧
Build hardened orchestration:
- triggers/conditions/actions
- scheduling/waits
- subflows
- retries
- approvals
- versioning
- staging
- replay
- simulation
- conflict detector
- self-audit
- execution trace

## Gate 5 — Communications 🚧
- unified inbox/thread model
- email/SMS/voice adapters
- templates
- sequences
- consent enforcement
- provider health
- Comms Command intelligence

## Gate 6 — Intelligence 🚧
- Signal Graph
- TODAY/Next Action
- Revenue Leak Scanner
- Forecast Brain
- Deal Coach
- Service Brain
- Growth Loop
- Data Medic

## Gate 7 — Analytics 🚧
- semantic metric layer
- dashboards
- reports
- attribution
- cohorts
- funnel/lifecycle
- hierarchy rollups
- goals/forecasting
- automation ROI
- agent contribution

## Gate 8 — Tax & Service Bureau Pack 🚧
Extract/rebuild from Elite Hub:
- bureau hierarchy
- preparer/office concepts
- tax client lifecycle
- client portal integration
- document chase
- return/signature states
- bank-product lifecycle
- fee/split/commission/reconciliation
- credential/compliance status
- tax workflows and events
- activation/health engine

Do not move tax calculation/MeF complexity into the horizontal core.

## Gate 9 — Extension Foundry 🚧
- SDK
- webhooks/events
- manifests/scopes
- workflow-node API
- provider adapters
- vertical pack registry
- UI extension points
- sandbox/testing

## Gate 10 — Consumer integrations 🚧
### MGR Agents
- replace local CRM writes with Legacy SDK
- agents become governed Legacy power users
- preserve agent execution context in event/audit records

### MGR Elite Hub
- consume shared customer/workflow/comms/analytics layers
- enable Tax & Service Bureau Pack
- remove duplicate CRM source of truth after parity migration

### Future apps
- integrate only the modules/packs needed

## Definition of done
- unit/integration/e2e tests
- migration/reconciliation tests
- permission isolation tests
- workflow replay tests
- provider-failure tests
- data import/export tests
- audit completeness
- observability
- backup/recovery
- load tests
- no duplicate source-of-truth records
- documented SDK and extension contracts
