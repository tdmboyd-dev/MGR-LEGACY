# Legacy full-build scorecard

## October 27 acceptance snapshot

| Scope | Before | After | Evidence |
|---|---|---|---|
| Scoped local service/database | Unverified | 26/26 executed pass | scripts/integration-scoped-postgres.mjs; parent wave2/legacy/scoped-postgres.log |
| Unit regression | 56 prior tests | 67/67 executed pass | parent wave2/legacy/unit-tests.log |
| PostgreSQL/API/concurrency | Prior CI only | Actual local PostgreSQL16.15 pass | parent wave2/legacy/*regression.log |
| Exact schema18-to20 preservation | Unverified | Old contact/response preserved; unknown digest fails closed | scripts/integration-v18-upgrade.mjs |
| Backup/restore | Prior CI only | Actual pg_dump/pg_restore pass | parent wave2/legacy/backup-restore.log |
| Full product | Unassessed | Unassessed | verified integration report gaps |
| Live provider/device/production | Unverified | Unverified | no such effects performed |

Acceptance percentages use passed checks divided by this explicit suite. They do not estimate time, profit or full product readiness. All 201 original product TS files plus new source/tests were read; the remaining tracked repository text was subsequently read too; installed dependencies/generated/runtime/binary content is excluded. Next: tenant-scoped workers/claims, explicit branch/join semantics, durable communications reconciliation and reversible field-parity cutover. Independent review findings were repaired and exercised against actual PostgreSQL.

# Legacy atomic review and activation repair — October 28, 2026

Branch `repair/completion-2026-10-28`, based on preserved audit head `dd8353b`. Default branch unchanged. Continue the wider existing build list; this checkpoint does not close Legacy.

Reproduced against real PostgreSQL 16 in a newly created random test schema: failed tax-review history INSERT left value changed (20 rather than 10); missing schema and workflow activation targets retired the prior active version; concurrent schema activation left two active versions. Initial suite passed 3/7. Two additional failure-injection checks were then added. Final suite passes 9/9, including transactional rollback if activation fails after retirement.

Tax review now locks the exact tenant/fact row, updates it and inserts its history in one transaction, preserving original value and a serial before/after chain under eight concurrent corrections. Returned state comes from the transaction's own updated row. Schema/workflow activation holds a tenant/object-specific transaction advisory lock, verifies/locks the target before retiring the prior active version, then commits both changes atomically. Missing targets and injected failures retain the old active version. Existing multi-version save APIs are unchanged; this acceptance covers activation methods, not a global uniqueness guarantee against arbitrary direct SQL or active-version inserts.

These three repositories now require the existing SqlDatabase transaction port; a query-only executor cannot promise atomic transitions. All internal consumers build. No migration or production database cutover was needed. No tax filing, signature, provider delivery or production acceptance occurred.

Verification: fresh local npm ci --ignore-scripts (34 installed, 0 audit findings), TypeScript build, 67/67 existing unit tests, 9/9 new real PostgreSQL atomic/concurrency checks and 26/26 existing scoped PostgreSQL checks. Counts describe separate scopes. The 26-check regression includes tenant/actor denial, idempotency, 20 concurrent deliveries, exact entity/event/outbox and pool/server reopen. Test schema was dropped in finally; only synthetic lab records were used. Original owner databases remain untouched.

Next: persisted branch/join/wait/subflow/compensation semantics, tenant-scoped checkpoint/trace/approval/context ports and atomic worker claims; composite tenant foreign keys after reviewing data; durable communication dispatch/recipient binding/callback/unknown reconciliation; field-level consumer parity and reversible recovery; hosted operations, retention and queue soak. Conditional edges stay denied until implemented. No migration/cutover or live communication is authorized by a passing repository test.

Source-reading scope: full current tax-pack-repository.ts, core-governance-repositories.ts, workflow-repository.ts, sql.ts, transaction.ts, postgres.ts, unit-of-work.ts and new test script; relevant migrations 0001/0003/0008 partial, 0018 full; API service callers and prior architecture/build/handoff documents inspected. Broader workflow and database source not freshly fully read in this continuation; older reading claims retain their historical scope.
