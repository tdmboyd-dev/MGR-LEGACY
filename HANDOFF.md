# MGR Legacy — Continuation / Handoff

Last updated: 2026-10-05

## Active implementation lane
Branch: `staging/legacy-foundation`

`main` contains the research/design source of truth. The staging branch contains live implementation and is the branch future work should continue from until verified and intentionally merged.

## Cost-control rule for GitHub Actions
Normal staging pushes MUST NOT run GitHub Actions.

Current CI triggers:
- manual `workflow_dispatch`
- pull requests targeting `main`

Do not re-enable push-triggered CI on staging. Batch verification deliberately instead of burning Actions on every file/commit.

## Locked product direction
MGR Legacy is the shared MGR relationship, automation, communications, intelligence, analytics and vertical-pack platform. It is not a renamed conventional CRM and it is not dependent on Floot for its architecture.

## Research/design source of truth
- `docs/research/INTERNAL_CRM_BEAST_AUDIT.md`
- `docs/research/MIGRATION_PROVENANCE.md`
- `docs/architecture/MASTER_ARCHITECTURE.md`
- `docs/architecture/CAPABILITY_MAP.md`
- `docs/native/NATIVE_SYSTEMS.md`
- `docs/build/BUILD_LIST.md`
- `docs/build/SHARED_ADOPTION_PLAN.md`

## Implemented packages

### `@mgr/legacy-contracts`
- tenant/scope contracts
- actors
- entity references/relationships
- universal events
- policy rules
- approval requirements
- commands
- next actions
- workflow definitions

### `@mgr/legacy-core`
- in-memory event ledger with idempotency
- hierarchy graph with tenant isolation
- policy engine with explicit deny/default deny/high-risk approval
- command bus
- customer relationship graph
- Object Forge registry
- Next Action ranking engine

### `@mgr/legacy-crm`
- contacts
- companies
- pipelines
- pipeline stages
- opportunities
- tasks
- bookings
- tenant-aware in-memory repositories
- CRM service with pipeline-stage integrity enforcement
- tests

### `@mgr/legacy-workflow`
- graph validation
- workflow simulator
- duplicate/competing automation conflict detection
- runtime executor
- automation self-audit / health scoring
- tests

### `@mgr/legacy-communications`
- channel contracts
- threads/messages
- consent records
- consent guard
- provider adapter contract
- tests

### `@mgr/legacy-intelligence`
- Signal Graph
- Revenue Leak Scanner
- Data Medic
- Forecast Brain
- tests for signal/leak behavior

### `@mgr/legacy-analytics`
- semantic metric registry
- metric aggregation
- ratio support
- attribution engine
- tests

### `@mgr/legacy-tax-pack`
- service bureau / child bureau / ERO-office / preparer domain contracts
- tax client lifecycle
- hierarchy health / activation engine
- tests

### `@mgr/legacy-extensions`
- extension manifests
- scoped permissions
- custom workflow-node manifests
- extension registry
- tests

### `@mgr/legacy-sdk`
- command execution
- TODAY retrieval
- workflow staging
- workflow simulation transport contracts

## PostgreSQL migrations
- `0001_foundation.sql`: tenants, hierarchy, actors, entities, relationships, Object Forge definitions, idempotency, event ledger, outbox, audit
- `0002_crm_work.sql`: pipelines, stages, opportunities, tasks, bookings
- `0003_automation_comms.sql`: workflow definitions/runs, communication threads/messages, consent
- `0004_tax_pack.sql`: tax office profiles + tax client lifecycle
- `0005_analytics_intelligence.sql`: metric definitions/points, signals, data-quality issues

## Immediate next build sequence
1. Postgres repository implementations
2. transactional command bus with DB idempotency + audit + outbox
3. workflow version repository + activation/replay
4. provider-independent communication service
5. TODAY orchestration across tasks/signals/leaks/workflows
6. Deal Coach
7. Service Brain
8. Growth Loop
9. stronger workflow conflict analysis
10. hierarchy rollup analytics
11. MGR Agents adapter/cutover
12. MGR Elite Hub adapter/cutover
13. Extension Foundry sandbox/version compatibility
14. one deliberate verification run after a large coherent batch

## Verification status
A local network-free container could not clone GitHub because outbound DNS/network is disabled in that runtime. Do not compensate by turning on push-triggered Actions. Use one deliberate CI run only after a large batch, or another non-billed/local environment when available.

## Floot
Project: MGR Sales Dashboard
ID: `3294f9f9-d5e0-450d-b777-79cfa6bbd433`

Floot code is not yet migrated because its file-read/build actions were blocked by the daily account cap. Do not wait on Floot. Continue building here. When readable, import under `legacy-import/floot/`, compare against canonical contracts, and mine reusable code without allowing it to overwrite the architecture.

## Working rule
Every pass should finish the largest coherent vertical slice possible: code + tests + docs + migration notes + acceptance criteria. Do not spend a pass only re-explaining the plan.
