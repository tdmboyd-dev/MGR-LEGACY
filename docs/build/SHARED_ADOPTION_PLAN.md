# Shared Adoption Plan

## Goal
One MGR relationship/automation source of truth, many MGR products.

## MGR Agents
### Today
MGR Agents already contains real CRM tables, APIs, UI and agent-callable tools.

### Migration
1. Freeze creation of new CRM primitives in MGR Agents.
2. Introduce `@mgr/legacy-sdk` adapter behind the current CRM service/tool layer.
3. Map local Contact/Company/Pipeline/Stage/Deal/Activity/Booking IDs to Legacy IDs.
4. Dual-write temporarily with reconciliation telemetry.
5. Backfill historical records and event history.
6. Switch reads to Legacy after parity.
7. Keep MGR Agents UI if desired, but make Legacy the data/action authority.
8. Remove duplicate storage only after reconciliation and rollback window.

### Agent behavior
Agents call Legacy capabilities through governed actions. Every agent mutation records:
- agent identity
- user/tenant scope
- initiating request
- approval state
- tool/action
- before/after
- causal/correlation IDs

## MGR Elite Hub
### Today
Elite Hub contains valuable tax, client, bureau, preparer, bank-product and compliance concepts, but also duplicate CRM/auth/workflow concerns.

### Migration
1. Add Legacy adapter.
2. Map client/person/business records into Customer Graph.
3. Register bureau/office/preparer hierarchy through Tax & Service Bureau Pack.
4. Register tax objects/events/workflows as pack extensions.
5. Move generic communication, tasks, workflow, analytics and relationship data to Legacy.
6. Keep tax-return calculation, MeF, ATS, tax forms and vertical compliance engines inside Elite Hub/Tax Pack services.
7. Dual-write and reconcile.
8. Cut over shared CRM reads/writes.
9. Retire duplicate CRM tables/services only after proven parity.

## Future MGR apps
Do not copy CRM code.

Choose integration mode:
- SDK/API only
- embedded MGR Legacy modules
- events only
- one or more vertical packs

Examples:
- creator/media app: people, organizations, deals, campaigns, communications, tasks
- capital/surplus app: claimants, cases, documents, workflows, communications, payouts
- tax app: shared core + Tax Pack

## Contract rules
- no direct cross-app database writes
- all mutations go through service contracts
- all mutations emit events
- all events are versioned
- external-provider IDs never become canonical IDs
- vertical packs may extend core; they may not fork core semantics
- permission checks happen server-side
- AI/agents never bypass approval/policy
- migrations require reconciliation reports

## Deployment shape
Recommended long-term:
- Legacy API/service layer
- shared Postgres data plane
- event/outbox + queue
- worker runtime
- provider adapters
- SDK packages
- embeddable UI packages
- pack registry

Individual MGR apps remain independently deployable consumers.
