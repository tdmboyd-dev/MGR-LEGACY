# MGR Legacy — Mandatory AI Operating Contract

This file is the first source of truth for **every AI, coding agent, developer, automation, or assistant** working in this repository.

## 1. Mandatory read order before changing code
Read these files in this exact order:
1. `AGENTS.md`
2. `AI_START_HERE.md`
3. `HANDOFF.md`
4. `README.md`
5. `docs/architecture/MASTER_ARCHITECTURE.md`
6. `docs/architecture/CAPABILITY_MAP.md`
7. `docs/native/NATIVE_SYSTEMS.md`
8. `docs/build/BUILD_LIST.md`
9. `docs/build/SHARED_ADOPTION_PLAN.md`
10. relevant research under `docs/research/`

Do not start implementation from assumptions or from one isolated source file.

## 2. Branch policy
- `main` is the continuously updated repository source of truth.
- `staging/legacy-foundation` is a short-lived active construction lane.
- Work may be developed on staging, but every coherent, reviewable chunk must be synchronized back to `main`.
- Never allow `main` to remain materially behind while substantial completed work exists on staging.
- If staging contains unfinished/broken code, document that explicitly in `HANDOFF.md`; do not pretend it is stable.

## 3. Required update discipline
After every meaningful implementation chunk:
1. update code and tests,
2. update `HANDOFF.md`,
3. update `AI_START_HERE.md` if architecture, priorities, package layout, or operating rules changed,
4. update `docs/build/BUILD_LIST.md` when a build gate changes state,
5. update research/provenance docs when new evidence or migrated code changes prior conclusions,
6. synchronize the coherent checkpoint to `main`.

The repository must always explain:
- what exists,
- what is complete,
- what is partial,
- what is blocked,
- what comes next,
- why architectural decisions were made,
- where imported or reused code came from.

## 4. GitHub Actions cost rule
Do **not** enable push-triggered GitHub Actions for normal staging or main commits.

CI is intentionally:
- manual via `workflow_dispatch`, or
- triggered by a pull request targeting `main`.

Batch verification deliberately. Do not waste Actions minutes on every file-level commit.

## 5. Product rule
MGR Legacy is not a conventional CRM clone.

It is the shared MGR relationship, automation, communication, intelligence, analytics, hierarchy, and vertical-pack platform used by MGR applications.

Core principles:
- one customer/entity graph,
- one event truth,
- provider-independent integrations,
- governed automations,
- idempotent mutations,
- full audit trail,
- policy/approval gates,
- simulation before risky automation activation,
- explainable intelligence,
- reusable vertical packs instead of duplicated CRMs.

## 6. Existing source systems
### MGR Agents
Use as a horizontal CRM/agent implementation source.
Do not copy blindly. Normalize into Legacy contracts.

### MGR Elite Hub
Use as the tax/service-bureau vertical implementation source.
Tax-specific behavior belongs in the Tax & Service Bureau Pack, not the horizontal core.

### Floot — MGR Sales Dashboard
Mine for reusable work when accessible.
Do not let Floot override canonical architecture.

## 7. Migration safety
Never perform a hard cutover without:
- 100% reconciliation for required records,
- zero unresolved duplicates/mismatches,
- verified rollback,
- complete audit evidence,
- acceptable error rate,
- explicit cutover readiness.

Prefer dual-write, compare, reconcile, then cut over.

## 8. Automation safety
Every automation system must support or preserve:
- versioning,
- staging,
- simulation/dry run,
- retries,
- idempotency,
- execution trace,
- conflict detection,
- recursive-trigger protection,
- approval gates where required,
- self-audit/health monitoring.

## 9. AI behavior rule
Do not spend a work pass merely repeating plans that are already documented.

Implement the largest coherent safe chunk possible, then update the source-of-truth files.

Never claim code is migrated, tested, complete, or verified unless that is actually true.

## 10. Handoff rule
Before ending a substantial work session, update `HANDOFF.md` with:
- active branch,
- last coherent checkpoint,
- implemented packages/features,
- known failures,
- verification state,
- next implementation order,
- external blockers,
- migration/cutover state.

A fresh AI should be able to continue without asking the owner to reconstruct prior decisions.
