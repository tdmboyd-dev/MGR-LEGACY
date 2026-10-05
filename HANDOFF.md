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

## Current cutover and safety implementation
- Postgres event ledger, idempotency, audit, outbox, and unit-of-work ports are implemented.
- Transactional commands now support idempotency, policy/approval, event emission, outbox enqueue, audit evidence, and atomic completion.
- Workflow version repository supports staging, activation, retirement, and replay-source access.
- Communications send service is provider-independent and consent-gated.
- MGR Agents and MGR Elite Hub source adapters are present with reconciliation utilities.
- Dual-write coordination and a cutover gate are implemented.
- TODAY orchestration ranks work tasks and revenue leaks into one action feed.
- Automation conflict detection now checks recursive triggers, duplicate actions, field-level competing updates, overlapping communication audiences, and blocks activation on critical conflicts.


## Latest completed checkpoint
- Postgres CRM repositories now persist contacts, companies, pipelines, stages, opportunities, tasks, and bookings.
- Postgres workflow repository persists workflow versions and activation state.
- Postgres communication repositories persist consent and outbound/inbound messages.
- Persistent hierarchy repository supports child/descendant queries.
- Persistent workflow-run repository tracks execution state, retries, cost, and errors.
- Hierarchy rollup analytics aggregate descendant metrics into bureau/organization totals.
- Extension Foundry compatibility checker and sandbox permission enforcement are implemented.
- AGENTS.md and AI_START_HERE.md are mandatory repository entrypoints for coding AIs.
- Main is synchronized after every coherent checkpoint.


## Latest durability/provider checkpoint
- DurableWorkflowRunner now persists node checkpoints while executing and moves failed retryable nodes into a resumable waiting state.
- Retry policy is integrated with workflow execution rather than existing only as a helper.
- Provider health persistence is implemented with health samples, routing state, circuit state, failure counters, and open/half-open/closed behavior.
- ProviderCircuitBreaker tests cover threshold opening and reset/probe behavior.
- PostgreSQL migration `0007_provider_health.sql` adds provider health samples and routing state.
- Database exports include persistent workflow checkpoints/replays and provider-health storage.
