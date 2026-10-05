# Floot Reclaim — Complete Build Queue

Updated: 2026-10-05

Floot is no longer a dependency or completion gate. This file preserves the complete scope previously assigned to the MGR Sales Dashboard / Floot effort and maps every item into MGR Legacy.

Status legend:
- ✅ implemented in Legacy
- 🟡 partially implemented / needs production proof
- 🔨 being reclaimed/building directly
- ⬜ not yet implemented as a first-class module
- 🚫 external Floot recovery no longer required for product completion

## A. Canonical data + evidence
1. ✅ Customer/business graph
2. ✅ Event ledger
3. ✅ Audit/evidence records
4. ✅ Action Receipts — argument summary, approvals, provider IDs, cost, outcome, rollback linkage
5. ✅ Truth Console — operator projection over receipts/audit/events

## B. Operator intelligence
6. ✅ TODAY / Universal Next Action
7. ✅ Revenue Leak Scanner
8. ✅ Signal Graph
9. ✅ Forecast Brain
10. ✅ Deal Coach
11. ✅ Service Brain
12. ✅ Growth Loop
13. ✅ Data Medic
14. ✅ Jev decision fabric — context + tool choice separated from deterministic authorization
15. ✅ Context Mesh / structured context assembly
16. ✅ Tool Map / capability selection registry

## C. Durable automation
17. ✅ workflow runtime, conditions, waits, retries, replay/checkpoints
18. ✅ FlowSpec formal workflow specification
19. ✅ Shadow Autopilot graduation ladder: observe → recommend → draft → ask → limited → autonomous
20. ✅ Workflow Simulator
21. ✅ Automation Conflict Detector
22. ✅ Automation Self-Audit/health
23. ✅ approvals/subflows/activation safeguards
24. ✅ outbox/retry persistence
25. ✅ dead-letter/operator recovery surface

## D. Policy, safety, trust
26. ✅ deterministic policy/default deny
27. ✅ approval gateway concepts and persisted approval governance
28. ✅ Action Receipts
29. ✅ Policy Compiler first-class module
30. ✅ prompt-injection/untrusted-memory isolation policy layer
31. ✅ privacy half-life / one-tick privacy enforcement
32. ✅ managed secrets/configuration contract
33. ✅ TEVV/evaluation harness

## E. Communications + control surfaces
34. ✅ unified inbox, consent, sequences, provider health/failover
35. ✅ Comms Command
36. ✅ command palette contract / universal operator command surface
37. ✅ realtime control/event surface
38. ✅ mobile/Telegram approval + control contracts
39. ✅ Local Bridge / Tauri least-privilege desktop bridge contracts
40. ✅ exact-target browser/computer execution contract

## F. Creation / media / connectors
41. ✅ Creation Factory orchestration
42. ✅ Media Job Ledger
43. ✅ MCP / connector registry
44. 🟡 external provider adapter registry
45. ⬜ live creation connector/runtime proof
46. ⬜ transcription/embeddings/image-generation provider integration proof

## G. Agent experience
47. ✅ agent memory / knowledge graph first-class module
48. ✅ Jarvis-style voice interface contract
49. ✅ perception / screen / camera contract
50. ✅ focus/accountability engine
51. ✅ governed agent actions through Legacy contracts
52. ✅ subagent/collections first-class runtime contracts

## H. Revenue/CRM playbooks from Floot
53. ✅ contacts/deals/pipelines/activity/lead scoring
54. ✅ speed-to-lead/follow-up/revenue leak foundations
55. ✅ proposal intent represented in deal/revenue intelligence
56. ✅ Sales playbook registry/contracts
57. ✅ Marketing playbook registry/contracts
58. ✅ Proposal playbook registry/contracts
59. ✅ Reputation playbook registry/contracts
60. ✅ no-show/re-engagement/follow-up primitives available through workflow/comms
61. ✅ recruiting/activation/referral/payment/onboarding playbook registry/contracts

## I. UI/dashboard scope from Floot
62. 🟡 sales dashboard metrics exist in analytics/data layer; dedicated UI is not part of this backend repo
63. 🟡 pipeline/deal/recent-lead/weighted forecast data exists; consumer UI still needs implementation
64. ⬜ command palette UI
65. ⬜ Truth Console UI
66. ⬜ responsive operator dashboard consumer surface
67. ⬜ mobile operator surface

## J. Named Elite-Hub/Floot-era intelligence surfaces
68. ✅ IntakeIQ
69. ✅ ClientPulse
70. ✅ RevenueRadar
71. ✅ FlowGenius

## K. Deployment / production proof
72. 🟡 PostgreSQL migrations exist; full real-database upgrade verification still required
73. 🟡 API exists; integration/e2e coverage still required
74. 🟡 provider adapters exist; real provider sandbox/live proof required
75. 🟡 MGR Agents adoption machinery exists; live cutover required
76. 🟡 MGR Elite Hub adoption machinery exists; live cutover required
77. ⬜ backup/restore drill
78. ⬜ load/concurrency/soak tests
79. ⬜ security/threat-model review
80. ⬜ deployment/rollback/disaster-recovery runbooks

## Rule

Nothing in this queue may be forgotten because Floot did not finish it. MGR Legacy owns the scope now. Floot recovery, if it ever happens, is optional historical salvage only and cannot block completion.
