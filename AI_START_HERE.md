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

## Source-of-truth rule
`main` must stay current with every coherent completed checkpoint.

Staging is only for active work that is not yet ready to represent as the latest coherent repository state.

## Before writing code
Read `AGENTS.md` and `HANDOFF.md`.

## After writing code
Update `HANDOFF.md`, affected build/research docs, and synchronize the coherent state back to `main`.
