# MGR Legacy Production Runbook

Updated: 2026-10-05

## Required environment

- Node.js 22+
- PostgreSQL with `pgcrypto`
- `LEGACY_DATABASE_URL` or `DATABASE_URL`
- optional `LEGACY_DATABASE_SSL=true`
- `LEGACY_API_TOKEN` for protected API access
- `LEGACY_DEFAULT_TENANT_ID` only when a deployment intentionally uses one default tenant

## Build and verification

1. `npm install`
2. `npm run typecheck`
3. `npm test`
4. build packages before using operational scripts
5. run `npm run verify:migrations` against an isolated clean database
6. run API integration/e2e suite when available
7. run load smoke against the deployed health endpoint

## Migration deployment

- Take a database backup before applying migrations.
- Run migrations exactly once through the Legacy migration runner.
- Never manually mark a migration complete.
- Compare `legacy_migrations` with files under `packages/database/migrations`.
- If a migration fails, stop cutover and restore/reconcile before retrying.

## API deployment

- deploy immutable build output
- inject secrets through the deployment secret store
- do not commit provider credentials
- check `/health`
- verify tenant-scoped authenticated requests
- verify Action Receipts and Truth Console reads
- verify worker/outbox processes before enabling autonomous modes

## Worker deployment

Workers must:
- use persisted workflow checkpoints
- honor retry/backoff limits
- publish through the outbox
- write Action Receipts
- move unrecoverable work to dead-letter storage
- expose health/metrics

## Cutover

For MGR Agents or MGR Elite Hub:
1. backfill
2. dual-write
3. reconcile
4. prove zero unexplained mismatches
5. cut reads to Legacy
6. maintain rollback window
7. cut writes to Legacy only after proven parity
8. retire duplicate source only after rollback window closes

## Rollback

Application rollback:
- redeploy previous immutable application release
- do not reverse schema migrations blindly
- keep new columns/tables unless a tested down-migration exists
- restore prior read/write authority using cutover state if consumer parity fails

Data rollback:
- use Action Receipts/event evidence to identify impacted mutations
- apply explicit compensating commands
- record rollback receipts
- never silently rewrite the audit/event history

## Backup and restore

Backup:
- `npm run backup:db -- backups/pre-release.dump`

Restore drill:
- provision isolated PostgreSQL
- point `LEGACY_DATABASE_URL` at the isolated instance
- `npm run restore:db -- backups/pre-release.dump`
- run migration verification
- run API/e2e verification
- record RTO/RPO evidence

## Disaster recovery

Minimum recovery assets:
- source commit SHA
- immutable build artifact
- database backup
- migration inventory
- secret-store references
- provider configuration inventory
- cutover authority state
- incident/action receipts
- operator runbook

Recovery order:
1. database
2. API
3. outbox/workers
4. provider adapters
5. realtime/control surfaces
6. consumer applications
7. autonomous execution modes

Keep autonomous execution at observe/recommend until post-recovery verification passes.
