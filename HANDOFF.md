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


## Shared API/MCP connector resume update — 2026-11-08

Documentation-only integration plan. Source baseline: `6f60bbdb83af29bfb3777c68bf013a3b384f76e8`. Review branch: `docs/mgr-connector-handoff-2026-11-08`. Existing content above is preserved. This update does not deploy, enable a connector, change credentials or certify live connectivity.

### Verified inspection and existing ownership

The current handoff records authenticated API/PostgreSQL and cross-process API/MCP reconciliation proof, alongside still-open deployed credentials/provider/cutover gates. `docs/architecture/API_MCP_INTEGRATION.md` already assigns Legacy business-system-of-record authority. Its older broad Creation OS routing prose must be read with the newer direct-domain Forge boundary; it does not require every domain call to go through Legacy or Creation OS.

### Work on this application's side

1. Reuse packages/api and existing command, authorization, idempotency, receipt and Truth Console contracts. Do not create another authoritative workflow/CRM ledger.
2. Verify the actual deployed service URL/credential and actor/tenant propagation for /v1/commands, /v1/truth/summary, /v1/truth/receipts and /v1/connectors against current source before acceptance.
3. Preserve domain authorization in addition to edge policy: approval must match action/target/payload, retries must return the same authoritative receipt, and uncertain commit outcomes must reconcile.
4. Keep Agents/Elite Hub backfill, dual-write parity, read cutover and rollback gates separate from basic connector reachability. A healthy endpoint does not certify data migration.

### Work on the shared MGR-API-MCP side

1. Reuse existing Legacy client and dispatch code; configure the real service rather than rebuilding its API. Preserve JWT-derived actor/tenant, audience/scope checks and service-side denial.
2. Return Legacy receipt/event/correlation IDs and safe projections. Gateway caches are not canonical business state; domain Forge and other standalone operations need no duplicate Legacy execution owner.

Use one versioned capability contract: capability ID/schema version, authenticated actor/tenant/resource scope, request/trace ID, bounded deadline, typed domain payload and authoritative result/evidence. Mutation lanes additionally need exact approval where required, stable idempotency key plus canonical input digest, and status/readback before retrying an unknown outcome. Capability discovery is not permission. Endpoint/secret configuration is operator-controlled, never an arbitrary caller-supplied proxy destination.

### Next acceptance gate and limits

Reproduce current command/receipt contract, wrong-tenant/spoofed-actor and missing-approval denials, same-key conflict, timeout-after-commit, edge/service restart and duplicate delivery against the intended deployment. Real-provider and final client acceptance remain pending until fresh receipts exist.

This pass inspected committed source/documents and checks preservation/readback of the documentation change only. It did not execute product tests, contact live domain services, deploy, or promote any existing completion-ledger status. At resume, reconcile fresh HEAD, active implementation branches and local work before coding; preserve unrelated concurrent changes. Historical proofs remain valid only for their recorded source/runtime scope. Readiness must distinguish source implementation, local test, real integration and live/owner acceptance.

### Source pointers at the inspected baseline

- [HANDOFF.md](https://github.com/tdmboyd-dev/MGR-LEGACY/blob/6f60bbdb83af29bfb3777c68bf013a3b384f76e8/HANDOFF.md)
- [docs/architecture/API_MCP_INTEGRATION.md](https://github.com/tdmboyd-dev/MGR-LEGACY/blob/6f60bbdb83af29bfb3777c68bf013a3b384f76e8/docs/architecture/API_MCP_INTEGRATION.md)
- [packages/api/src/http.ts](https://github.com/tdmboyd-dev/MGR-LEGACY/blob/6f60bbdb83af29bfb3777c68bf013a3b384f76e8/packages/api/src/http.ts)
- [packages/api/src/auth.ts](https://github.com/tdmboyd-dev/MGR-LEGACY/blob/6f60bbdb83af29bfb3777c68bf013a3b384f76e8/packages/api/src/auth.ts)
