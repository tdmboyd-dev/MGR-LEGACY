# MGR Legacy — Continuation / Handoff

Last updated: 2026-10-06

## Canonical state

`main` is the source of truth. Normal pushes must not consume GitHub Actions minutes; use the existing manual/targeted verification workflows only when a meaningful proof is needed.

MGR Legacy is the authoritative shared business data/workflow/action layer. MGR-API-MCP is the client-neutral AI/MCP edge. Creation OS remains the creation/media authority.

## Verified repository-owned hardening

The repository now includes and has passed the available automated proof for:

- PostgreSQL 16 clean migration execution through migration `0018_tax_fact_graph.sql`
- upgrade-path migration execution from the earlier schema state
- authenticated API/PostgreSQL integration
- tenant-isolation and tenant-spoof rejection
- malformed JSON and oversized-payload handling
- command idempotency and concurrent-delivery behavior
- backup/restore recovery
- Tax Fact Graph persistence, field-level confidence/review lineage and explicit preparer filing approval
- governed browser/desktop tax-software adapter contracts with reviewed-fact and target-verification guards
- Action Receipts / Truth Console authority
- MGR-API-MCP cross-process timeout-after-commit reconciliation, duplicate delivery and edge restart proof
- authenticated remote MCP boundary and client-neutral ChatGPT plugin packaging

Latest successful PostgreSQL hardening run recorded in this work: GitHub Actions run `37299843446`.

## Consumer adoption now wired

### MGR Elite Hub

Elite Hub has a real Legacy tax client and authenticated Tax Fact review/filing-approval routes. Tax facts, review state and filing approvals are no longer intended to create a second authoritative tax-fact ledger in Elite Hub.

### MGR Agents

`src/lib/legacy/bridge.ts` exists in MGR Agents and the actual CRM mutation tools are now wired into it for contact create/update, deal create/update and activity logging. Shadow mode can mirror real tool traffic for reconciliation without making Legacy authoritative prematurely.

The cutover rule remains strict: do not retire the existing MGR Agents or Elite Hub stores until real backfill/dual-write parity and rollback are proven with their deployed data.

## What cannot be completed by repository code alone

These are external proof/credential/real-data gates, not missing core modules:

- real provider credentials and live/sandbox email/SMS/voice delivery/callback/failover proof
- deployed worker/queue soak and real monitoring/alert sinks
- production-scale load and security/penetration testing
- real MGR Agents historical backfill, parity reconciliation, read cutover and rollback window
- real Elite Hub historical backfill/shared-layer cutover and rollback window
- IRS/MeF credentials, certificates, ATS/production authorization and live tax-provider/bank approvals
- public MCP hosting/OAuth configuration and the final hosted ChatGPT MCP session

Do not fabricate these receipts. Record them only when the external systems actually produce evidence.

## Resume order

Read:
1. `AGENTS.md`
2. `AI_START_HERE.md`
3. this file
4. `docs/build/BUILD_LIST.md`
5. `docs/build/REMAINING_WORK.md`
6. `docs/build/FLOOT_RECLAIM_BUILD_QUEUE.md`

When a repository-owned gap is found, implement/test/fix it before reporting. Keep `main` and these source-of-truth files current.


## Ecosystem review — October 27, 2026

Additive source-pinned ecosystem context: [human handoff](docs/ecosystem/HUMAN-HANDOFF.md). This review branch preserves the default-branch baseline and existing work orders. Domain runtime/production acceptance is separate.


## October 27 - scoped real service and source hardening

Active branch: `audit/ecosystem-2026-10-27`; owner asked to preserve default branches. Read [verified integration report](docs/ecosystem/LEGACY-VERIFIED-INTEGRATION.md) before relying on older completion claims. All 201 original product TypeScript files and 20 migrations were read, plus new source/tests. The remaining tracked repository text was subsequently read too; installed dependencies, generated output and runtime/binary files are outside the reading claim. Reading does not certify full product acceptance.

Executed: 67 unit tests; 26 scoped real PostgreSQL checks; PostgreSQL/API/concurrency regressions; exact v18-to-v20 preservation; v7-to-v20 upgrade; actual backup/restore. Parent ecosystem evidence owns complete Tevin/MCP workflow acceptance. Generated local fixture credentials remain outside this repo. Production stores were not overwritten.

Bootstrap requires `LEGACY_API_TOKEN`, `LEGACY_DATABASE_URL`, `LEGACY_SERVICE_ACTOR_ID`, `LEGACY_ALLOWED_TENANT_IDS`, `LEGACY_ALLOWED_ACTIONS`; host defaults to loopback. Scoped receipt reads require a granted action filter and bind the service actor. EventLedger read methods now require tenant ID first. Unknown legacy key digests conflict while preserving old responses. Historical outbox duplicates require reviewed migration.

Open implementation gaps include branch/wait/subflow integration, tenant-scoped worker ports, atomic activation/review, general tenant SQL references and durable communications reconciliation. Keep live/dangerous tools disabled until their own proof. Follow the next sequence in the verified integration report.


## October 28 atomic governance continuation

On repair/completion-2026-10-28, tax review/current state+history and schema/workflow activation are now transactional. Reproduced partial-write, missing-target retirement and concurrent-active-version failures are repaired. Fresh TypeScript and67/67 unit tests pass; real isolated PostgreSQL atomic/failure/concurrency9/9 and existing scoped integration26/26 pass. See evidence/completion-2026-10-28/RESULTS.md for the exact before/after, source ledger, compatibility boundary, cleanup and remaining queue. No general workflow, live-provider, cutover or production completion claimed. Main is preserved; this branch retains prior audit fixes.
