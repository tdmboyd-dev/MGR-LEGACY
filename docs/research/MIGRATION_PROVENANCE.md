# Migration Provenance

## Current source systems

### Floot
Project: **MGR Sales Dashboard**
Project ID: `3294f9f9-d5e0-450d-b777-79cfa6bbd433`

Status on 2026-10-05:
- Project was located successfully.
- Floot did not complete the assigned build/export path.
- MGR Legacy has reclaimed the known Floot-assigned scope directly; Floot is no longer a product dependency or completion gate.
- The recovered scope inventory is preserved in `docs/build/FLOOT_RECLAIM_BUILD_QUEUE.md`.
- No Floot source bytes are claimed as migrated. If an export becomes available later, it is optional historical salvage and provenance review only.
- `legacy-import/floot/` remains reserved only for such future archival import.

### MGR Agents
Repository: `tdmboyd-dev/MGR-Agents`
Role: horizontal CRM/agent implementation source.

Evidence directly inspected during this pass included:
- `src/lib/db/schema/crm.ts`
- `src/lib/tools/impl/crm.ts`
- `AUTOMATION_NORTH_STAR.md`
- workflow/CRM research artifacts under `scripts/training-workers/gen-upgrade/`

### MGR Elite Hub
Repository: `tdmboyd-dev/MGR-Elite-Hub`
Role: tax/service-bureau vertical source.

Evidence directly inspected during this pass included:
- `docs/FEATURE_CATALOG.md`
- `docs/MGR_ELITE_HUB_AUDIT_2026/TARGET_ARCHITECTURE.md`
- `docs/training/PREPARER_QUICKSTART_GUIDE.md`
- `docs/Timebeunus_Frontend.md`

## Rule
Nothing is called "migrated" until its bytes/code have actually been copied or rebuilt and verified. Research/design artifacts may describe a source before code migration, but must keep provenance.
