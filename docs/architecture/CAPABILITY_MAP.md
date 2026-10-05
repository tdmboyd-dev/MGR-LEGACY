# MGR Legacy — Complete Capability Map

Legend:
- **CORE** = shared MGR capability
- **NATIVE+** = MGR-native synthesis/upgrade
- **PACK** = vertical pack capability
- **PROVIDER** = MGR owns orchestration/data/logic but uses an outside rail/provider

## Foundation
1. Multi-tenant organizations/workspaces — CORE
2. Hierarchies / parent-child tenants — CORE
3. Users, teams, roles, attributes, scopes — CORE
4. Policy engine / permissions — CORE
5. Approval gateway / human-in-the-loop — CORE
6. Audit ledger — CORE
7. Consent/preferences/privacy — CORE
8. Idempotency / mutation receipts — CORE
9. Import/export — CORE
10. Data retention / archival — CORE

## Relationship data
11. Contacts/people — CORE
12. Companies/businesses — CORE
13. Households/groups — CORE
14. Relationship edges — CORE
15. Ownership/assignment — CORE
16. Tags/lists/segments — CORE
17. Notes/files/attachments — CORE
18. Custom fields — CORE
19. Custom objects via Object Forge — NATIVE+
20. Identity resolution/dedup — CORE + NATIVE+

## Sales / lifecycle
21. Pipelines — CORE
22. Stages — CORE
23. Opportunities/deals — CORE
24. Products/services — CORE
25. Quotes/proposals — CORE
26. Pricing/discount approvals — CORE
27. Forecasting — CORE + NATIVE+
28. Goals/quotas — CORE
29. Win/loss tracking — CORE
30. Deal Room — NATIVE+
31. Deal Coach — NATIVE+

## Work management
32. Tasks — CORE
33. Queues — CORE
34. Cases/tickets — CORE
35. SLA policies — CORE
36. Bookings/calendars — CORE
37. Playbooks/checklists — CORE
38. Projects/milestones — CORE
39. Approvals — CORE
40. Workload/capacity — CORE + NATIVE+

## Communications
41. Unified inbox — CORE
42. Conversation threading — CORE
43. Email — PROVIDER
44. SMS/MMS — PROVIDER
45. Voice/calling — PROVIDER
46. Voicemail — PROVIDER
47. Portal messaging/chat — CORE
48. Templates/snippets — CORE
49. Sequences/cadences — CORE
50. Broadcast/campaign sends — CORE
51. Quiet hours/DNC/consent — CORE
52. Deliverability/provider health — CORE
53. Conversation intelligence — NATIVE+
54. Comms Command — NATIVE+

## Marketing / growth
55. Forms — CORE
56. Landing-page/event intake hooks — CORE
57. Lead routing — CORE
58. Segmentation — CORE
59. Campaigns — CORE
60. Attribution — CORE
61. Referrals — CORE
62. Reactivation — CORE
63. Cross-sell/upsell signals — NATIVE+
64. Growth Loop — NATIVE+

## Automation
65. Event triggers — CORE
66. Schedule triggers — CORE
67. Webhook triggers — CORE
68. Conditions/branches — CORE
69. Delays/waits — CORE
70. Loops/iteration — CORE
71. Parallel paths — CORE
72. Subflows — CORE
73. Actions/connectors — CORE
74. Approvals — CORE
75. Retries/backoff — CORE
76. Compensation/rollback strategies — CORE
77. Workflow versioning — CORE
78. Staging/publish — CORE
79. Replay — CORE
80. Dry run — CORE
81. Workflow Simulator — NATIVE+
82. Automation Conflict Detector — NATIVE+
83. Automation Self-Audit — NATIVE+

## Intelligence
84. Lead/contact scoring — CORE
85. Signal Graph — NATIVE+
86. TODAY/Next Action Engine — NATIVE+
87. Revenue Leak Scanner — NATIVE+
88. Forecast Brain — NATIVE+
89. Service Brain — NATIVE+
90. Data Medic — NATIVE+
91. Anomaly detection — NATIVE+
92. Explanation/evidence layer — NATIVE+
93. Universal Command Layer — NATIVE+

## Analytics
94. KPI dashboards — CORE
95. Custom reports — CORE
96. Semantic metric definitions — CORE
97. Funnels — CORE
98. Cohorts — CORE
99. Lifecycle analytics — CORE
100. Attribution reports — CORE
101. Revenue reports — CORE
102. Forecast reports — CORE
103. Hierarchy rollups — CORE
104. Workflow analytics — CORE
105. Automation ROI — NATIVE+
106. Agent contribution — NATIVE+
107. Data quality health — NATIVE+

## Integrations / platform
108. REST/API — CORE
109. Webhooks — CORE
110. SDK — CORE
111. OAuth/provider adapters — CORE
112. App manifests — CORE
113. Custom workflow nodes — CORE
114. UI extension points — CORE
115. Event subscriptions — CORE
116. Integration health — CORE
117. Extension Foundry — NATIVE+

## Tax & Service Bureau Pack
118. Bureau hierarchy — PACK
119. Child bureau — PACK
120. ERO/office — PACK
121. Preparer — PACK
122. Client household tax context — PACK
123. Tax-year lifecycle — PACK
124. Document chase — PACK
125. Return status — PACK
126. Review/signature state — PACK
127. Form 8879 linkage — PACK
128. EFIN/PTIN/credential state — PACK
129. Bank-product eligibility — PACK
130. Bank-product lifecycle — PACK
131. Fee/split/commission rules — PACK
132. Funding/reconciliation — PACK
133. Compliance evidence — PACK
134. Training/readiness — PACK
135. Hierarchy Health + Activation Engine — NATIVE+ PACK
136. Tax-specific workflow nodes/events — PACK

## What stays outside the shared core
- IRS tax calculation engines
- MeF payload/transmission details
- ATS certification implementation
- tax form rendering
- provider-specific telephony/SMS internals
- payment/network rails
- vertical-specific compliance engines that do not generalize

## Target behavior
MGR Legacy should match the major capability families expected from modern CRM/automation platforms while making MGR's differentiator the coordination layer: one graph, one event truth, governed automation, explainable intelligence, simulation, leak detection, next-action execution, hierarchy-aware operations, and reusable vertical packs.
