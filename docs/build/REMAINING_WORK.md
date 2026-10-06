# MGR Legacy — Exact Remaining Work

Updated: 2026-10-06

## Repository-owned completion state

The core Legacy implementation and the hardening work that can be proven from repository-controlled CI are built.

Completed repository-owned proof includes:

- PostgreSQL migrations through `0018_tax_fact_graph.sql`
- clean PostgreSQL 16 migration execution
- upgrade-path migration execution
- authenticated API/PostgreSQL integration
- tenant isolation and spoof rejection
- malformed/oversized request handling
- idempotent replay and concurrent-delivery checks
- backup/restore drill
- load-smoke harness
- Action Receipts and Truth Console
- Tax Fact Graph, review lineage and explicit filing approval
- governed tax-software adapter contracts
- MGR API/MCP authenticated boundary plus cross-process duplicate/timeout/restart reconciliation
- MGR Agents CRM mutation bridge wired to real contact/deal/activity tool paths
- Elite Hub Tax Fact/filing-approval bridge wired to Legacy

Latest successful Legacy PostgreSQL hardening run recorded here: `37299843446`.

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

Do not describe any external item above as complete until the real system produces evidence. Do not reopen repository-owned items merely because an older document still says they are planned; reconcile the document instead.

Floot is optional historical salvage and is not a product dependency.
