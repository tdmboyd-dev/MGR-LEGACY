# MGR LEGACY

MGR Legacy is the shared relationship, automation, communications, intelligence, and vertical-workflow platform for the MGR ecosystem.

It is **not** a copy of MGR Agents CRM, MGR Elite Hub CRM, or a conventional CRM. It consolidates the strongest reusable code and concepts from those systems, the completed competitive research, and a new set of MGR-native capability contracts.

## Product shape

**Shared core**
- Identity, tenancy, permissions, hierarchy, audit
- Customer / business / household graph
- Contacts, companies, relationships, custom objects
- Pipelines, stages, opportunities, cases, tasks, bookings
- Universal event ledger + activity timeline
- Workflow engine + rules + approvals + human-in-the-loop
- Omnichannel communications
- Reporting, attribution, forecasting, goals
- Agent/tool action layer
- Integration / extension framework

**MGR-native intelligence**
- TODAY / Next Action Engine
- Revenue Leak Scanner
- Signal Graph
- Object Forge
- Comms Command
- Deal Room
- Forecast Brain
- Deal Coach
- Service Brain
- Growth Loop
- Data Medic
- Workflow Simulator
- Automation Conflict Detector
- Automation Self-Audit
- Universal Command Layer
- Hierarchy Health / Activation Engine
- Extension Foundry

**Vertical packs**
- Tax & Service Bureau Pack (from MGR Elite Hub)
- Additional MGR application packs can plug into the same core without duplicating CRM logic.

## Source-of-truth folders

- `docs/research/` — research synthesis, internal repo audits, evidence/gap records
- `docs/architecture/` — canonical architecture and domain contracts
- `docs/native/` — MGR-native feature designs
- `docs/build/` — implementation sequence and acceptance gates
- `legacy-import/` — reserved for the full Floot project import

## Migration status — 2026-10-05

- MGR-LEGACY GitHub repository: initialized as the new source of truth.
- MGR Agents CRM: re-audited and mapped for reuse/rebuild.
- MGR Elite Hub CRM/tax/bureau modules: re-audited and mapped for reuse/rebuild.
- Floot project identified as **MGR Sales Dashboard**.
- Full Floot file export is still pending because Floot is currently refusing file-read/build actions after the account reached its daily action cap. The code has **not** been represented here as migrated until it is actually readable and copied.

See `docs/build/BUILD_LIST.md` for the code path.
