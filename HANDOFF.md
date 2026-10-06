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
