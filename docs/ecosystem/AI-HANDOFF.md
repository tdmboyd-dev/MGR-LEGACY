# MGR-LEGACY — AI ecosystem handoff


October 27 evidence correction: read [the verified integration report](LEGACY-VERIFIED-INTEGRATION.md) for current acceptance. Older completion checkmarks include contracts/helpers; broad worker, conditional workflow and live-provider behavior remains unfinished. Scoped real PostgreSQL checks pass 26/26 and unit tests 67/67. The narrow local contact service is connected; full Tevin proof is recorded by the parent ecosystem run.
Baseline: `6f60bbdb83af29bfb3777c68bf013a3b384f76e8`. Existing default: `main`. Repository: https://github.com/tdmboyd-dev/MGR-LEGACY.

Read existing AGENTS/work order/current handoff first. This file is integration context, not an additional work order or grant.

## Architecture and source anchors

Role: business-records. Shared bearer containment is not full actor/role authorization. Real tax filing, messaging and cutover remain separate effects.

Source anchors: `packages/api/src/auth.ts`, `packages/api/src/bootstrap.ts`, `packages/api/src/services.ts`, `packages/api/src/http.ts`. Paths are source locators, not an assertion that all internals were read. See the central path/hash ledger for inventory; human-read scope is narrower.

Inputs: Trusted service request, tenant-owned business object, canonical action and approval context.

Outputs: Business graph mutations/reads, workflows, Action Receipts and Truth Console projections.

Declared root package scripts (source declarations; not all were executed):

```json
{
  "typecheck": "tsc -b",
  "build": "tsc -b",
  "test": "npm run build && node --test packages/*/dist/**/*.test.js",
  "verify:migrations": "npm run build && node scripts/verify-migrations.mjs",
  "backup:db": "node scripts/backup-postgres.mjs",
  "restore:db": "node scripts/restore-postgres.mjs",
  "load:smoke": "node scripts/load-smoke.mjs",
  "test:postgres": "npm run build && node scripts/integration-postgres.mjs",
  "test:api-postgres": "npm run build && node scripts/integration-api.mjs",
  "test:upgrade-path": "npm run build && node scripts/integration-upgrade-path.mjs",
  "test:backup-restore": "npm run build && node scripts/integration-backup-restore.mjs",
  "test:concurrency": "npm run build && node scripts/integration-concurrency.mjs",
  "test:reset-postgres": "node scripts/reset-integration-postgres.mjs"
}
```

## Current repair and proof

Deny missing token; stop startup before database operations; reject five body-tenant override paths.

This cycle: 56/56 passed for TypeScript build + Node suite. This is not whole-product acceptance.

## Next implementation contract

Work item `ECO-009`: Trusted per-principal tenant/object/action policy; cross-tenant upsert conflict checks; real outbox/provider replay proof and production-data cutover.

Before dispatch bind principal, tenant/workspace/resource, canonical domain action, input/artifact revision digest, idempotency/correlation, account/recipient/cost ceiling and grant expiration where applicable. Resolve risk using server-owned action policy, not caller labels. Exact fields must adapt to existing ONE/domain contracts, not duplicate them.

Negative acceptance: wrong actor/tenant/scope, modified payload/target, expired/replayed approval, duplicate request, lost response, cancellation and restart. Domain owner retains authoritative receipt; unknown outcomes are reconciled before retry. Rights and consent follow the actual artifact/model/use.

Rollback: Preserve original source/data; revert only owned source change; reconcile external effects before retry or compensation.

## Integration truth

The new source catalog lists this repository as catalogued, with runtimeVerified=false and no executable tools. Local read-only discovery through ONE/API-MCP has separate integration proof. No discovery response authorizes execution or proves this domain is deployed. Candidate existing tool: `mgr_truth_summary`; validate configured transport and scopes.

Highest-value measured upgrade: One customer graph and durable event/outbox truth reused by apps instead of copied CRMs; measure parity and duplicate-effect rate.
