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

Acceptance percentages use passed checks divided by this explicit suite. They do not estimate time, profit or full product readiness. All 201 original product TS files plus new source/tests were read; not every research/archive document. Next: tenant-scoped workers/claims, explicit branch/join semantics, durable communications reconciliation and reversible field-parity cutover. Independent review findings were repaired and exercised against actual PostgreSQL.
