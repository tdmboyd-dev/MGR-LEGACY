# MGR Legacy — Continuation / Handoff

Last updated: 2026-10-05

## Active implementation lane
`main` is the current verified source of truth. `staging/legacy-foundation` must be fast-forwarded to the same checkpoint after this documentation refresh.

## Cost-control rule for GitHub Actions
Normal pushes MUST NOT run GitHub Actions.

Current CI triggers after verification:
- manual `workflow_dispatch`
- pull requests targeting `main`

Push-triggered CI was enabled only for one deliberate verification batch and then removed after the Node 22 install/typecheck/test run passed.

## Current verified checkpoint
- dependency install: passed
- TypeScript typecheck: passed
- full `npm test`: passed
- verification commit: `1095b359c3c4d65bdab24ec52da1e06f9db29cc2`
- repository migrations: `0001` through `0017`
- Floot is no longer a dependency or completion gate.

## Floot scope reclamation
The known MGR Sales Dashboard/Floot assignment has been reclaimed directly into MGR Legacy and is tracked in:
- `docs/build/FLOOT_RECLAIM_BUILD_QUEUE.md`

New first-class modules include:
- Action Receipts
- Truth Console
- Shadow Autopilot
- FlowSpec
- Jev decision fabric
- Context Mesh
- Tool Map
- Policy Compiler
- privacy/untrusted-memory isolation
- managed secret references
- command palette
- agent memory graph
- voice/perception contracts
- focus/accountability engine
- governed subagents/collections
- dead-letter recovery
- Local Bridge / exact-target computer control
- realtime + mobile/Telegram control contracts
- model/cost routing
- Creation Factory + Media Job Ledger
- MCP/connector registry
- external provider registry
- TEVV harness
- operator UI package/renderers
- provider integration package for voice/transcription, embeddings, image generation, and creation jobs
- CRM playbook registry
- IntakeIQ
- ClientPulse
- RevenueRadar
- FlowGenius

## Persistent control/runtime additions
- migration `0016_operator_control_plane.sql`: Action Receipts + autonomy profiles
- migration `0017_reclaimed_runtime.sql`: creation jobs + workflow dead letters + connector manifests
- Postgres repositories for receipts/autonomy, media jobs, dead letters, and connector manifests
- canonical API commands automatically write success/failure Action Receipts
- Truth Console/receipt API routes and SDK methods are available

## Operations/hardening tooling
- `scripts/verify-migrations.mjs`
- `scripts/backup-postgres.mjs`
- `scripts/restore-postgres.mjs`
- `scripts/load-smoke.mjs`
- `docs/operations/PRODUCTION_RUNBOOK.md`
- `docs/security/THREAT_MODEL.md`

## What is still not production-proven
Core and reclaimed modules are built and current CI is green, but completion still requires evidence that cannot be honestly fabricated in this repository alone:
- execute all migrations against real PostgreSQL, including upgrade paths
- API/database integration and end-to-end tests against a real test database
- cross-tenant/security boundary tests
- real provider credentialed sends/generation/transcription/embedding tests and outage/failover drills
- deployed queue/worker soak/recovery tests
- live backup/restore drill
- load/concurrency results
- MGR Agents live backfill/dual-write/reconciliation/cutover
- MGR Elite Hub live backfill/dual-write/reconciliation/cutover
- security review/TEVV execution in the deployed environment

Floot recovery is optional historical salvage only; it is not on the completion critical path.

## Source-of-truth rule
Read `AGENTS.md`, `AI_START_HERE.md`, this file, `docs/build/BUILD_LIST.md`, `docs/build/REMAINING_WORK.md`, and `docs/build/FLOOT_RECLAIM_BUILD_QUEUE.md` before further implementation.

