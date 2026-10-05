# MGR Legacy — Continuation / Handoff

Last updated: 2026-10-05

## Active implementation lane
Branch: `staging/legacy-foundation`

`main` contains the research/design source of truth. The staging branch contains the live implementation and is the branch future work should continue from until the foundation is verified.

## Locked product direction
MGR Legacy is the shared MGR relationship, automation, communications, intelligence and vertical-pack platform. It is not a renamed conventional CRM and it is not dependent on Floot for its architecture.

## Research/design already present
- `docs/research/INTERNAL_CRM_BEAST_AUDIT.md`
- `docs/research/MIGRATION_PROVENANCE.md`
- `docs/architecture/MASTER_ARCHITECTURE.md`
- `docs/architecture/CAPABILITY_MAP.md`
- `docs/native/NATIVE_SYSTEMS.md`
- `docs/build/BUILD_LIST.md`
- `docs/build/SHARED_ADOPTION_PLAN.md`

## Implemented so far
### Contracts
- tenant/scope
- actors
- entities/relationships
- universal events
- policies
- approvals
- commands
- next actions
- workflow definitions

### Core
- in-memory event ledger with idempotency
- hierarchy graph with tenant isolation
- policy engine with explicit deny/default deny/high-risk approval
- command bus
- customer relationship graph
- Object Forge registry
- Next Action ranking engine

### SDK
- command execution
- TODAY retrieval
- workflow staging
- workflow simulation transport contracts

### Database
Initial PostgreSQL migration for:
- tenants
- hierarchy nodes
- actors
- entities
- relationships
- object definitions
- idempotency keys
- event ledger
- outbox
- audit entries

## Immediate next build sequence
1. repository/database interfaces + Postgres implementations
2. transactional command bus with idempotency + audit + outbox
3. CRM domain: contacts, companies, pipelines, stages, opportunities, tasks, bookings
4. workflow runtime + versioning/staging/replay
5. simulator + conflict detector + self-audit
6. communications model + provider adapters
7. Signal Graph + TODAY + Revenue Leak Scanner
8. analytics/semantic metrics
9. Tax & Service Bureau Pack
10. MGR Agents adapter/cutover
11. MGR Elite Hub adapter/cutover
12. Extension Foundry

## Floot
Project: MGR Sales Dashboard
ID: `3294f9f9-d5e0-450d-b777-79cfa6bbd433`

Floot code is not yet migrated because its file-read/build actions were blocked by the daily account cap. Do not wait on Floot. Continue building here. When readable, import under `legacy-import/floot/`, compare against canonical contracts, and mine reusable code without allowing it to overwrite the architecture.

## Working rule
Every pass should finish the largest coherent vertical slice possible: code + tests + docs + migration notes + acceptance criteria. Do not spend a pass only re-explaining the plan.
