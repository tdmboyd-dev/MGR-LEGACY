# MGR Legacy — Exact Remaining Work

Current qualification and proof scopes live in [HANDOFF.md](../../HANDOFF.md). Canonical focused66ONE/73Legacy/113API and27chain checks pass; full joined qualification/security/publication remain pending. Earlier21chain/55ONE receipts retain their isolated source scope. [BUILD_LIST.md](BUILD_LIST.md) retains every original build gate. Core implementation is substantial; repository-owned work remains.

## Remaining ordinary event work

1. Qualify the newly wired normal ONE host/server/WorkTools routes in the full joined run and register controlled actual domain/edge hosts and tenant scopes explicitly.
2. Implement downstream field-authority/staleness reconciliation, ledger quota/retention and operational error/latency observability.
3. Define cursor rebase and credential-rotation behavior, then qualify broader workflows, migration parity and recovery. The bounded chain does not cover every domain writer, privileged sequence manipulation or Legacy restore.

## Other ordinary repository work

- Integrate conditional branch/join, persisted waits/subflows and general workflow semantics; unsupported conditional edges must fail closed.
- Implement persisted workflow compensation/rollback through the existing runtime, checkpoint and Action Receipt contracts. Bind the tenant/run/workflow version, completed original actions and explicitly authorized compensation; retain durable progress and original-to-compensation receipt linkage. Qualify partial failure, cancellation, duplicate/restart recovery, conflicts and uncertain original/compensation outcomes before retry. Do not compensate an unknown external effect blindly or describe database transaction rollback, cutover-state switching or a reversed repair plan as completed workflow compensation. Real provider/payment effects remain separately gated.
- Complete tenant-scoped worker ports and general tenant SQL reference enforcement, then qualify durable runner recovery across broader jobs.
- Complete durable communications reconciliation and callback/failover behavior; primitives do not establish delivery.
- Validate production-source intelligence adapters, analytics data/performance, extension threat model and webhook/runtime integration.
- Expand Agents and Elite Hub adoption beyond the bounded connected paths; retain exact backfill, dual-write, parity and rollback gates below.
- Continue `FLOOT_RECLAIM_BUILD_QUEUE.md` and `SHARED_ADOPTION_PLAN.md` where applicable, using `../ecosystem/LEGACY-VERIFIED-INTEGRATION.md` and `../../evidence/completion-2026-10-28/RESULTS.md` for original evidence boundaries.

## Remaining work that requires real external systems

These are not honest candidates for fake repository completion.

### MGR Agents live adoption
- configure the deployed Agents instance with the real Legacy endpoint/token/tenant mapping
- backfill historical CRM records
- run shadow/dual-write against real traffic
- reconcile contacts/deals/activity to 100% cutover-critical parity
- exercise rollback
- switch reads only after parity
- retire duplicate CRM authority only after the rollback window

### MGR Elite Hub live adoption
- configure the deployed Elite Hub instance with the real Legacy endpoint/service credential
- backfill real bureau/office/preparer/client/tax state
- reconcile shared CRM/workflow/comms/analytics data
- prove the Tax Fact/review/filing-approval path with real tenant data
- exercise rollback and then cut shared reads/writes over

### Real providers and infrastructure
- provider credentials for chosen email/SMS/voice vendors
- sandbox/live sends, callbacks and failover receipts
- deployed queue/worker soak and restart proof
- real observability/log/metric/alert sinks
- production-scale load test
- deployed security review/penetration test

### Tax/IRS/bank external gates
- X.509/MeF credentials and IRS ATS/production authorization
- required ATS acceptance evidence
- bank-provider approvals, credentials and live integration tests
- any year-specific IRS artifacts that are not publicly available or have not been supplied

### Hosted MCP external gate
- provision the real public HTTPS host
- configure the real OAuth/Auth0 resource and tenant claim
- supply the deployed Legacy endpoint/service credential
- complete the final hosted ChatGPT MCP connection/session proof

## Rule

Do not describe any external item above as complete until the real system produces evidence. Do not reopen a proven bounded item from stale prose, and do not close broader repository-owned work from a helper or local receipt.

Floot is optional historical salvage and is not a product dependency.
