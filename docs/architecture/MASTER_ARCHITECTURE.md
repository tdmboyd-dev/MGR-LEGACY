# MGR Legacy — Master Architecture

## 1. Platform layers

### A. Trust & tenancy
- Organizations, brands, workspaces, bureaus, offices, teams
- Users, agents, service accounts
- Roles + attributes + scopes + step-up approvals
- Audit ledger
- Consent/privacy preferences
- Idempotency and mutation receipts

### B. Customer Graph
A single identity/relationship model for:
- people
- households
- businesses
- organizations
- leads
- customers
- partners
- preparers
- offices
- bureaus
- agents
- custom entity types

Relationships are first-class edges, not copied fields.

### C. Object Forge
Schema registry for configurable first-class objects:
- custom object types
- typed fields
- validations
- formulas
- relationships
- lifecycle states
- ownership
- views
- permissions
- events
- workflow triggers

### D. Universal Event Ledger
Every meaningful mutation emits a normalized event:
- actor
- tenant/scope
- entity
- event type/version
- old/new state
- source
- causation/correlation IDs
- workflow/agent attribution
- timestamp
- evidence/audit payload

This becomes the backbone for automation, analytics, replay, debugging, AI context and compliance.

### E. Work engine
- tasks
- queues
- SLAs
- approvals
- calendars/bookings
- playbooks
- cases
- opportunities
- projects
- recurring work

### F. Workflow Runtime
- event, schedule, inbound webhook and manual triggers
- conditions
- branching
- waits
- loops/iteration
- parallel branches
- subflows
- actions
- approvals
- retries/backoff
- compensation
- versioning
- staging
- replay
- simulation
- conflict detection
- dry run
- execution trace
- self-audit

### G. Communications
Provider-independent orchestration for:
- email
- SMS
- voice/calls
- voicemail
- chat
- portal messages
- social/DM adapters where permitted
- templates
- sequences
- inbox
- conversation threading
- consent/DNC/preferences
- deliverability and provider health

### H. Intelligence
- Signal Graph
- Next Action
- scoring
- Revenue Leak Scanner
- Forecast Brain
- Deal Coach
- Service Brain
- Growth Loop
- Data Medic
- conversation intelligence
- anomaly detection
- workload/capacity intelligence

### I. Analytics
- semantic metrics
- funnels
- cohort/lifecycle analytics
- attribution
- goals
- forecasting
- hierarchy rollups
- quality/compliance metrics
- automation ROI
- agent contribution
- custom dashboards/reports

### J. Extension Foundry
- stable SDK
- events
- webhooks
- app manifests
- permissions/scopes
- custom actions
- custom workflow nodes
- UI extension points
- vertical pack registration
- connector/provider adapters

## 2. Vertical-pack model

MGR Legacy stays horizontal. A vertical pack can register:
- object schemas
- events
- workflow nodes
- permissions
- dashboards
- reports
- policy rules
- UI modules
- AI skills/actions

### Tax & Service Bureau Pack
Adds:
- bureau → child bureau → ERO/office → preparer hierarchy
- client/household tax lifecycle
- tax-year context
- document chase
- return status
- signatures
- bank products
- fee/split/commission/reconciliation
- EFIN/PTIN/credential status
- compliance controls
- office activation and health

## 3. Shared-use rule for MGR apps

MGR Agents, Elite Hub and future MGR apps should integrate through a Legacy client/SDK rather than maintaining separate CRM databases.

Each consuming app can choose:
- embedded UI modules
- API/SDK only
- event subscription only
- vertical pack(s)

## 4. Non-negotiable architecture properties
- multi-tenant by construction
- provider independent
- versioned contracts
- audit-first
- idempotent mutations
- event-driven
- replayable
- observable
- policy gated
- AI can propose; permissions/approval govern execution
- no vertical domain leakage into core
