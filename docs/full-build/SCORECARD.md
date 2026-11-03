# Legacy full-build scorecard

## November 3 Tevin integration candidate

| Check | Result |
|---|---|
| Repository build and tests | 67 passed via `npm test` |
| Scoped Legacy integration | 26 passed on fresh isolated PostgreSQL 16.15 via `scripts/integration-scoped-postgres.mjs` |
| Tevin owner-service integration | 2 passed at MGR-ONE `41e56846006b42c51f348fde54b9b82cda95b6ea`, including one saved contact after restart and replay |
| Source identity | Legacy packages match scoped parent `dd8353bd26234b20940243891d12a7e0da978056` |
| Main adoption, permanent endpoint, deployment | Open |

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
