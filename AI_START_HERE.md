# MGR Legacy — AI Start Here

## What this repository is
MGR Legacy is the shared MGR platform for relationship data, CRM/work management, automations, communications, intelligence, analytics, hierarchy-aware operations, and reusable vertical packs.

The design was synthesized from:
- competitive CRM/automation research,
- MGR Agents CRM/agent implementation,
- MGR Elite Hub tax/service-bureau implementation,
- MGR-native product inventions.

## Current working structure

### Core packages
- `packages/contracts` — canonical contracts
- `packages/core` — events, hierarchy, policy, customer graph, commands, TODAY
- `packages/crm` — contacts, companies, pipelines, opportunities, tasks, bookings
- `packages/workflow` — workflow runtime, simulation, conflict detection, health
- `packages/communications` — threads, consent, provider-independent communication contracts
- `packages/intelligence` — Signal Graph and native intelligence systems
- `packages/analytics` — semantic metrics and attribution
- `packages/tax-pack` — tax/service-bureau vertical behavior
- `packages/extensions` — Extension Foundry contracts
- `packages/database` — PostgreSQL migrations and persistence ports
- `packages/adapters` — migration/cutover adapters for MGR systems
- `packages/sdk` — consumer SDK

## Native MGR systems
Important native systems include:
- TODAY / Next Action
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

See `docs/native/NATIVE_SYSTEMS.md` for the full designs.

## Current architectural direction
- MGR Agents becomes a consumer of shared Legacy CRM/actions rather than owning a separate long-term CRM truth.
- MGR Elite Hub consumes Legacy shared CRM/automation/comms/analytics plus the Tax & Service Bureau Pack.
- Future MGR apps use the same shared platform instead of copying CRM code.

## Current continuation

Read [HANDOFF.md](HANDOFF.md) for the single current status, exact proof boundaries and continuation order. The event packet and normal ONE routes are applied; canonical focused66ONE/73Legacy/113API and27chain checks pass. Full joined qualification/security/publication remain pending. [BUILD_LIST.md](docs/build/BUILD_LIST.md) retains gate identities and [REMAINING_WORK.md](docs/build/REMAINING_WORK.md) retains all ordinary and external work. Capability names above describe architecture, not accepted hosted features.

AGENTS.md defines operating rules. Preserve source authority, owner decisions and original recovery/evidence. Parent owns integration/publication on the current repair branch; do not follow superseded staging/audit branch orders. Update these same authoritative documents when actual acceptance changes.
