# Legacy verified integration and repairs - October 27, 2026

Legacy is the shared business record keeper: people, relationships, deals, activities, events and action receipts. Keep that responsibility here. Tevin chooses an approved task; API/MCP carries verified identity; Legacy owns the durable mutation. Creation, speech, contract signing and another reasoning brain do not belong in this service.

## Executed acceptance

- 26/26 scoped real PostgreSQL workflow checks passed.
- 67/67 local unit tests passed.
- Existing PostgreSQL, API and concurrency scripts passed against actual PostgreSQL 16.15. Twenty concurrent requests made one contact/event/idempotency record. Two hundred local health requests passed; this is a smoke check, not production load.
- Exact schema-18-to-20 upgrade preserved the old contact and stored response. Old keys without a provable digest fail closed instead of guessing.
- Separate schema-7-to-20 upgrade and actual pg_dump/pg_restore passed with all 20 migration records.
- Fresh API/database pools preserve saved state. The actual PostgreSQL daemon and API were also restarted. The parent ecosystem run owns full Tevin-to-MCP-to-Legacy proof.

The PostgreSQL instance uses synthetic fixture data, loopback, generated credentials and no registered Windows service/global install. Credentials and database/runtime folders remain outside source deliverables.

## Repairs

1. Service grant binds actor, allowed tenant IDs and named actions. Actor/tenant spoofing, ungranted actions and shadow ingest are blocked. Receipt reads bind the service actor and require a granted action filter. Contact reads cannot return another entity type.
2. Added actual person readback, fixed Windows bootstrap entrypoint and defaulted to loopback. Production bootstrap requires explicit actor/tenant/action grants.
3. Replay binds actor, scope, action, target and exact payload digest. Concurrent reservations replay committed results. Legacy keys lacking digests preserve their old response but require reconciliation.
4. API/MCP propagates target/scope, bounds the complete response stream, blocks redirects, limits response bytes and hides remote error bodies. Reconciliation checks tenant, actor, action, correlation, key and digest together.
5. Globally keyed upserts cannot overwrite another tenant's reports, goals, templates, sequences, enrollments, signals, receipts, creation/dead-letter rows, signatures, bank products or tax facts.
6. Event reads require tenant scope. Event and outbox repeats must match saved contents. Changed repeats conflict. Outbox event/topic uniqueness prevents duplicate publication rows.
7. Enabled CRM mutations validate tenant ownership of contact, pipeline, stage and activity subject.
8. Communications no longer invent delivery receipt IDs. Uncertain acceptance cannot trigger an automatic backup send. Provider tenant filtering, consent identity and recipient-zone quiet hours are enforced. No real communication was sent.
9. Empty voice/media/embedding responses cannot be reported as success. Invalid migration evidence, repeated backfill cursors, invalid authorization expiry, unknown hierarchy scope, malformed autonomy evidence and empty evaluations fail safely.
10. Cyclic, empty or mismatched workflow execution is rejected. Conditional edges fail closed because branch semantics are not implemented. Approval helpers enforce roles/positive thresholds, and schedules honor named time zones.

## Source reading

All 201 original product TypeScript files, including tests, were semantically read end to end. New source/tests were also read. All 20 SQL migrations and mandatory architecture/build/handoff documents were read. The SHA-256 ledger distinguishes full, partial and unread content. All remaining tracked repository text (documentation, configuration, manifests, lockfile and scripts) was subsequently read as well. The ledger excludes installed dependencies, generated outputs and runtime/binary files. Reading is not a claim that every capability is complete.

## What exists versus what remains

The capability catalog is a target architecture. Many modules are short contracts, scoring/planning helpers or in-memory registries. They are useful foundations, not a complete CRM interface or a deployed worker platform.

- Branches, waits, subflows and compensation are not orchestrated end to end by the shared runtime. Conditional edges are now rejected instead of executing unintended effects. Implement explicit branch/join/skip semantics with persisted resume evidence.
- Internal checkpoint, trace, approval and context-loader ports still use run IDs without tenant arguments. Keep them within trusted workers. Multi-tenant deployment needs tenant-scoped ports, atomic claims and leases.
- Several SQL foreign keys identify objects globally rather than by tenant plus ID. Enabled CRM handlers check ownership; general repositories need composite constraints and review of existing references before tightening a real database.
- Tax review updates current state and review history separately. Schema/workflow activation also needs atomic/concurrency hardening before broad admin/tax tools are enabled. The scoped Tevin service does not expose those routes.
- Communications need durable pre-dispatch operations, recipient/contact binding, provider reconciliation and callbacks before live sends. No email/SMS/call, filing, bank application or signing occurred.
- Provider receipt/artifact references do not verify remote bytes, physical devices, delivery, rights or production readiness.
- No MGR Agents or Elite Hub production backfill/cutover occurred. Keep their newer stores until field-level parity, recovery and an explicit cutover window are proved. ID-only reconciliation is not field parity.
- Hosted authorization, general retention, monitoring, queue soak and production operational ownership remain open.

## Next sequence

Immediate: keep the narrow verified contact workflow; extend read/update/activity coverage and a small founder-facing record viewer using the same service authority. Show source versus live status honestly for every capability.

30 days: implement tenant-scoped worker ports and atomic claims; specify/test branch/join behavior; add durable dispatch/reconciliation before external communication. Exercise multi-process restarts and cancellation.

90 days: connect one real MGR Agents or Elite Hub workflow in read-only comparison, reconcile required fields, then prove reversible migration on an isolated copy. Qualify one provider at a time with actual sandbox receipts.

6-12 months: expand tools after their permissions, receipts, recovery and saved records meet this standard. Train Tevin from the verified capability registry rather than the aspirational catalog. This matters more than adding more named helper classes.

## Upgrade and recovery

0019 preserves existing responses and adds a nullable request digest. Unknown old keys deliberately conflict; reconcile them from authoritative records, never populate invented digests. 0020 adds a unique outbox(event_id,topic) index. Historical duplicates must stop upgrade for reviewed investigation. No records are automatically deleted or merged. Back up first; preserve source snapshot and database backup together. Review delivery history before resolving any duplicate.

## PostgreSQL provenance

Official Windows ZIP distribution pointer: https://www.postgresql.org/download/windows/
EDB binary: https://get.enterprisedb.com/postgresql/postgresql-16.15-1-windows-x64-binaries.zip
Verified SHA256: 25e6fcdfb8caec38691bf461125e7564508760666f7b8e5dc6a5f0818f58f81e
EDB checksum publication: https://github.com/EnterpriseDB/edb-installers/issues/696

Independent review identified read-grant overreach and changed-content event duplicates. Both were repaired and exercised against actual PostgreSQL. No default branch was changed.
