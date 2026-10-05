# Internal CRM BEAST Audit

Date: 2026-10-05

## Decision

Do **not** merge the old CRMs wholesale.

Use:
- **MGR Agents** as the primary horizontal CRM/agent foundation.
- **MGR Elite Hub** as the primary tax/service-bureau vertical source.
- **MGR Legacy** as the canonical shared platform where the concepts are normalized, hardened, and rebuilt behind stable contracts.

## MGR Agents — confirmed reusable foundations

Repository: `tdmboyd-dev/MGR-Agents`

Confirmed in code:
- Contacts with status, source, tags, score, ownership and custom fields
- Companies / organization links
- Pipelines and ordered stages
- Deals/opportunities with amount, probability, status and close date
- Activities linked to contacts/deals/agent runs
- Booking calendars and bookings
- CRM tools callable by agents for contact/deal/activity operations
- CRM dashboard/API surface
- Lead-scoring implementation
- Workflow/automation research artifacts and event-driven direction
- Agency/sub-tenant concepts in advanced CRM research artifacts

### Keep
- Canonical contact/deal/activity primitives
- Agent-action pattern
- Event-driven automation direction
- Booking primitives
- Pipeline/deal interaction model
- Existing tests and behavioral rules that still match the new contracts

### Rebuild / normalize
- User-centric ownership into organization/tenant/hierarchy aware ownership
- Flat customFields JSON into Object Forge schema + typed field definitions
- Simple activity types into universal event/activity model
- Simple probability/score logic into explainable signal + scoring framework
- CRM-specific tools into shared Legacy SDK/actions
- Pipeline state changes into governed workflow/event contracts
- Permissions into the shared policy engine

### Throw away / avoid carrying forward
- Duplicate CRM implementations
- UI-coupled business logic
- Any mock/training-only behavior treated as production truth
- Hard-coded feature assumptions that prevent vertical packs
- Any path that bypasses audit, idempotency, permissions, or event recording

## MGR Elite Hub — confirmed reusable vertical assets

Repository: `tdmboyd-dev/MGR-Elite-Hub`

Confirmed in repository docs/code surface:
- Tax client lifecycle pipeline
- Secure client portal
- Document upload/OCR/versioning/request flows
- E-signature workflows including Form 8879 lifecycle
- Appointment/communication flows
- Bureau management
- PTIN/EFIN/preparer credential concepts
- Tax return lifecycle and MeF-specific workflows
- Bank products, eligibility, disclosures and funding lifecycle
- Fee, split, commission and payout concepts
- Revenue forecasting
- Audit trails and compliance services
- Workflow engine and automation service
- Tiered permissions
- Client concierge/support concepts

### Keep
- Tax lifecycle domain knowledge
- Service bureau / office / preparer hierarchy semantics
- Return/document/signature/bank-product workflow semantics
- Fee/commission/reconciliation rules as vertical domain contracts
- Compliance/event evidence requirements
- Client portal workflow ideas
- Preparer/office operational metrics

### Rebuild / normalize
- Duplicate auth/role enums into one policy/hierarchy model
- Backend abstraction into Legacy data/service contracts
- CRM Pro client records into shared customer graph
- Tax-only automation into shared workflow runtime + Tax Pack nodes
- Bank/preparer/return events into universal event ledger
- Standalone forecasting into Forecast Brain with vertical features
- Separate messaging into Comms Command
- Separate analytics into shared metrics/semantic layer

### Keep isolated as Tax Pack
These should not pollute every MGR application:
- Tax return forms/calculation
- MeF/ATS
- EFIN/PTIN-specific flows
- Form 8879
- tax-bank products
- tax disclosures
- preparer credential/CE logic
- bureau/ERO tax compliance
- tax-year versioning

## Shared-platform rule

Every MGR app should consume the same shared contracts for:
- identity
- customer/entity graph
- events
- workflows
- communications
- tasks
- objects
- permissions
- analytics
- agent actions

Vertical-specific behavior must register through extension contracts rather than forking the core.
