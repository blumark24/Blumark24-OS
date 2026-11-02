# BLUMARK24 CORE × SMART HSR — Unified Executive Master Plan V2.0

**Date:** 2026-11-02 · **Owner:** Blumark24 Holding — Board · **Execution owner:** Blumark24 Core CTO/Head of Product · **Status:** PROPOSED / NOT DEPLOYED · **Document authority:** one master plan for the Core ↔ HSR AI Workforce integration. 
**Change boundary:** Documentation-only. No existing production UI, app code, credentials, Firebase/B2 data, Vercel aliases, or tenant IAM are modified by this plan.

## 0. Executive decision — one architecture, three independent operating entities

BLUMARK24 HOLDING (board / investment / risk)
→ BLUMARK24 CORE (a shared internal **control plane**, NOT a fourth business entity)
→ 1) Defense = Blumark24 OS (internal HR, operations, tasks, governance)
→ 2) Attack 1 = Blumark24 Services (sales, marketing, customer service and automation)
→ 3) Attack 2 = SMART HSR (independent configurable public/private municipal SaaS).

**Non-negotiable:** The three operating entities remain independent in operations, tenant boundaries, credentials, data and commercial decisions. Corporate ownership does not grant technical access to municipal citizen data. The approved visual identities, RTL interfaces, maps, and existing UX remain unchanged.

**The user experience:** The existing **المقر الحي (Live HQ)** is the Board-facing office/secretary/CEO interface; CORE runs behind it without replacing its approved design. A human employee gets one role-aware AI copilot within their EXISTING product, rather than a new account that silently inherits administrator privileges. The Holding Board gets summaries and approved decision records from Core; a tenant municipal manager sees only their organization's data inside SMART HSR.

## 1. Source-backed baseline — don't confuse proposals with deployed capabilities

| Area | Inspected evidence | Current status |
| --- | --- | --- |
| Blumark24 OS | \`src/app/ai/page.tsx\` has a client-facing AI workspace; \`src/app/api/ai/chat/route.ts\` currently integrates Anthropic, Supabase identity and per-user rate limit | EXISTING PRODUCT CODE; **not** an operational Blumark Core service |
| SMART HSR AI | \`api/ai/analyze.js\` has an inspector-scoped advisory Vision flow with a provider router (Gemini/OpenAI options), pilot organization gate and manager human review; \`api/ai/bind-analysis.js\` binds cached output | EXISTING PRODUCT CODE; NOT proof that all employees have copilots |
| SMART HSR IAM | \`api/_lib/authz.js\` separates owner/manager/supervisor/inspector/contractor; Lands service entitlements include \`lands_employee\`, \`lands_department_manager\` | REUSE REAL RBAC; do NOT invent U1–U8 role mappings |
| SMART HSR protected release | Production domain \`smart.blumark24.com\` on protected deployment \`dpl_2CvDF5CmcGrYvWooah8gu6hF1LnX\`, SHA \`c07ec531de800a405e2d168e97c3dc492a622bdc\` at latest verified inspection; Draft PR #113 on \`5b17b0166ca5ab946f266576be838e11df2c8e16\` unmerged | NEVER use Draft as municipal Production |
| SMART HSR release gates | Baseline 001: **32 earned / 35 assessed / 65 not evaluated** evidence points, **not** percent of programmed functionality. Exact Draft SHA prior CI had 8/8 green jobs; CodeQL 17 SARIF flags still need reviewer disposition | NOT READY FOR LIVE AGENT WRITES |
| Backup/privacy/IAM | Firestore real backup + isolated restore not evidenced; Backblaze UI showed 5 broad-capability app keys with no visible expiry; provider/model data flows need PDPL review | G01/G02/G03/G06 HOLD; no live citizen data to Core or models until approved |
| Blumark24 Core | Approved internal concept (AI HQ command center, Agent Academy, agent workers, policy/approval/observability), no verified autonomous backend deployment | PROPOSED ARCHITECTURE, not an existing integrated product |

Evidence pointers: 
- OS: https://github.com/blumark24/Blumark24-OS/blob/main/src/app/api/ai/chat/route.ts
- HSR: https://github.com/blumark24/smart-hsr-manager/blob/main/api/ai/analyze.js
- HSR closure: https://github.com/blumark24/smart-hsr-manager/issues/121
- HSR Draft: https://github.com/blumark24/smart-hsr-manager/pull/113

## 2. Architecture: Control Plane in Core, Data Plane in each product

\`\`\`mermaid
flowchart TB
    BOARD["BLUMARK24 HOLDING — Board"]
    CORE["BLUMARK24 CORE — Agent Registry / Academy / Policy / Task Router / Approvals / Cost / Audit"]
    OS["DEFENSE — Blumark24 OS (HR / internal tasks)"]
    SV["ATTACK 1 — Blumark24 Services (clients / marketing)"]
    HSR["ATTACK 2 — SMART HSR (government / private SaaS)"]
    T1["Municipality A — isolated tenant boundary"]
    T2["Municipality B — isolated tenant boundary"]
    BOARD <-->|"approved, sanitized reports"| CORE
    CORE <-->|"scoped task and summary contracts"| OS
    CORE <-->|"scoped task and summary contracts"| SV
    CORE <-->|"scoped orchestration, no raw municipal records"| HSR
    HSR --- T1
    HSR --- T2
\`\`\`

**Blumark24 Core responsibilities** (shared services; no uncontrolled direct DB access):
1. **Agent Registry / Workforce Directory:** agent role, agency, owner, versioned skills, authorized tools, active/inactive, approved model/provider.
2. **Academy & Evaluation:** synthetic training cases, scenario tests, prompt versioning, skills assessment, rollback of agent version.
3. **Task Router / Workflows:** receive metadata-only task intents and normalized status events; identify on-call worker, budget and SLA; no autonomous approval of privilege changes.
4. **Policy Decision Point:** check organization/service/role, data classification, execution scope, action risk tier, spend cap, and required human approval. DENY by default.
5. **Approval Center:** immutable request IDs, approver, reason, expiry, decision, idempotency; board approval for corporate investment/production deployment, tenant management approval for municipal workflow decisions.
6. **Model Gateway & AI Observability:** provider-agnostic model routing, timeout/cost limits, model/version, grounded response tests, structured trace **without raw sensitive prompts**, offline evaluation and audit.
7. **Board Command Desk:** text/voice assistant as interface to **approved summaries** and human decision queues; voice is a later stage, not an unrestricted action channel.

**SMART HSR responsibilities** (data plane retained inside product trust boundary):
- Firebase Authentication and scoped Firestore rules remain source of truth for tenant identity and municipal business records; service-role entitlements decide what an employee may see.
- AI execution requiring actual municipal information occurs in a **SMART HSR-controlled** agent runtime/service gateway only, where tenant policies and data handling can be enforced, not in the Holding workspace.
- The existing \`/api/ai/analyze\` advisory flow and manager review remain intact. No agent can silently change observation status, assign contractors, approve land grants, change users, delete files, make procurement commitments, or publish releases.
- Municipal data never gets copied into Core's HR directory, corporate dashboards or model training sets. In phase 1, Core receives only **sanitized counts, task-state codes, request IDs, and redacted risk flags** with documented purpose.

**Blumark24 OS responsibilities:** source of truth for Holding/agency **internal** workforce and corporate tasks only. Do not use OS organization records as substitutes for municipal tenant users or Firestore roles.

## 3. Every employee gets a scoped copilot — not an independent super-admin

**Identity separation:** \`employee_type=corporate_staff\` (company/agency) or \`employee_type=municipal_tenant_user\` (customer tenant). A person may have distinct identities but no implicit role equivalence. Agent identity is \`agent_run\`, bound to a verified human caller and organization.

| Human persona | AI assistant's first allowable work | Prohibited without additional approval |
| --- | --- | --- |
| Holding CEO / Board | Approved KPI summary, investment queue, risk/report synthesis | Viewing citizen identities or directly changing municipality records |
| SMART HSR corporate Product/Engineering | Release evidence, synthetic QA, PR analysis, support-triage | Unreviewed merge/deploy, copying production records |
| Municipal manager | Explain queues and SLA, draft weekly municipal report **within tenant** | Creating admin users, changing land grant status or deleting records on AI authority |
| Section supervisor / department head | Prioritize and summarize assigned department cases | Assigning outside own organization, bypassing supervisor role limits |
| Field inspector | Draft observation classification and suggested priority from authorized evidence | Auto-close/edit verified observations, sending unapproved images to providers |
| Smart Lands employee / manager | Missing-document checklist, completion quality, draft decision memo | Grant approval, identity disclosure, cross-tenant beneficiary search |
| Mobility supervisor / field staff | Vehicle/task queues and scheduling suggestions within assigned scope | Unapproved vehicle assignment, changing official operational status |
| HR / administrative employee | Internal onboarding, follow-ups, agenda, staff task summaries | Bulk account creation, payroll changes or access revocation without authorization |

**All U1–U8 UAT accounts:** do not hardcode role → agent assignment; read the **actual** service entitlement of each synthetic test account in an isolated staging environment and test denied capability paths. Missing UAT accounts are defects, not substitutes for arbitrary production user creation.

**Agent template record (design, not migrated DB):**
\`agent_id, agency_id, environment, employee_type, tenant_id?, human_user_id?, service_id, verified_role, permitted_skills[], permitted_actions[], approval_policy_id, model_policy_id, data_classification, max_cost, status, version\`.

## 4. One safe integration contract

**Workflow**:
1. Authenticated human in SMART HSR → existing Firebase identity / tenant / service-role verification.
2. Product-owned AI gateway computes \`allowedActions\`, redaction and sensitivity, before any model call.
3. Core may receive a **minimal task descriptor** such as \`correlation_id, origin_product, tenant_pseudonym, actor_type, skill_id, skill_version, action_class, status_code, aggregate_metric\` (not raw names, coordinates, photos, IDs, beneficiary data, medical data or documents).
4. Core selects a versioned agent skill and policy, returns a bounded execution plan or approval request.
5. The SMART HSR server executes only whitelisted **read/advice** tools for the human's verified role, logs \`on_behalf_of\`, and performs any approved mutation through existing authenticated business endpoints.
6. Human reviews evidence and approves in the **product's own** workflow. An audit record contains \`trace_id, policy_decision, approver, action_id, result_status\`; avoid storing raw personal prompts or provider tokens.

**Required controls:** signed short-lived service identities, mTLS or suitable service-to-service transport, least-privilege scoped tokens, strict idempotency, origin allowlist, replay protection, queues/DLQ, bounded retries, schema versioning, circuit breaker, rate limits, prompt-injection defenses, audit trails, consent/legal basis and documented retention, and an immediate per-tenant **AI kill switch**. No shared production API keys across OS / Services / HSR. No Core-owned production Firestore/B2 service-account key.

**Action policy classes:**
- \`R0\` safe explanation, synthetic training or non-sensitive aggregate → automated under explicit policy.
- \`R1\` tenant-scoped read or advisory draft → authenticated authorized user; may require model/data-use approval.
- \`R2\` operational change (assignment/status, communication) → named authorized human approval + verified existing endpoint.
- \`R3\` irreversible/security/financial/government action (account privileges, grant decision, production deploy, delete, procurement, payments) → **AI cannot authorize**, two-person/manual release governance where appropriate.

## 5. Single delivery roadmap — ordered dependency gates

| Stage | Planned effort (estimate, not commitment) | Done only when ... | Product owner |
| --- | --- | --- | --- |
| **G0 – Protect SMART HSR** | depends on authorized cloud access | Firestore backup metadata **and isolated restore proof**; B2 effective staging/production key boundary and least-privilege change plan; vendor privacy/risk review; P0/P1=0 validated; UAT plan remains isolated | Security + SMART HSR Release |
| **P1 – Core contract, no sensitive data** | 1–2 weeks after decision | Approved system boundaries, role matrix, event schema, agent skill manifest, cost budgets, API contracts, threat model, observability schema | Core Architect + Board |
| **P2 – Internal synthetic pilot** | 1–2 weeks | Core registry and task router work with synthetic records; 2 pilot agents: **SMART HSR support/QA** and **municipal field inspector advisory** in isolated Staging, disabled by default elsewhere | Core + HSR Engineering |
| **P3 – Cross-product controlled pilot** | 2–3 weeks | Company employees connect through Blumark24 OS internal task metadata; municipal assistant operates strictly inside HSR; human approval, tenancy denial, prompt-injection, evidence quality, budgets and rollback all pass | DEF + HSR + Security |
| **P4 – Expand approved role templates** | 2–3 weeks | Additional verified roles for manager, sections, Lands and Mobility. All U1–U8 synthetic role/route/session tests green, performance and accessibility signoff, legal/privacy signoff, signed tenant pilot agreement | SMART HSR Product |
| **P5 – Production rollout** | only after all approvals | Separate incremental release per municipality/tenant, explicit deployment approval, evidence+rollback drill, monitoring and incident runbook, supervised ramp; no bulk migration or big-bang merge | Release Authority + Tenant |

**Scheduling:** Early Core *contract and synthetic prototype* may run alongside G0 without touching Production. Any **live** municipal AI data integration is BLOCKED until G0 is signed. Preserve SMART HSR's current delivery gate rather than reopening the municipal product redesign.

**No new subscription recommended** until synthetic pilot proves utility. Choose workflow engine (existing n8n versus Activepieces), model gateway, and tracing tool based on evidence and measurable costs. ChatGPT Project/AI HQ is the executive workspace; it is not proof of independently running production agents.

## 6. Acceptance gates and objective KPIs

**Hard GO gates (all mandatory before live municipal access):**
- Verified Firestore recovery; Backblaze effective privilege isolation, rotation+rollback; separate environments, no cross-tenant reads.
- AuthN/AuthZ UAT positive and negative matrices for *actual* role/service/user/tenant, using synthetic data.
- 100% test pass for \`R2/R3\` unapproved-mutation denials; **zero** unauthorized action outcomes.
- Human approval evidence, audit trace completeness, user-facing AI source disclosure, provider failure fallback and kill switch.
- Security/privacy reviewer signoff to applicable SDAIA PDPL, national cybersecurity and municipal procurement requirements; cross-border data-flow assessment before any foreign provider receives protected data.
- Owner-approved visual baseline; DESIGN GUARDIAN read-only (no forced Unslop redesign).

**Pilot targets** (targets, NOT measured achievements):
- 100% correct role/tenant policy decisions on a pre-approved adversarial synthetic test matrix, including 100% denial for prohibited paths.
- ≥90% evidence-grounded advice on pre-agreed, reviewed synthetic scenarios; no invented municipal status or AI claim.
- ≥30% decrease in median **human preparation time** for selected report/triage tasks relative to a measured baseline (hypothesis to validate).
- 100% auditable agent-run decisions and approval events, with any unlogged action blocking GO.
- Track cost per accepted task, time to complete, intervention rate, provider failures, P95 latency and manual rework.
- No new production release incidents attributable to Core.

**ROI template:**
\`monthly_net_benefit = (minutes_saved_per_accepted_task ÷ 60 × validated_hourly_labor_cost × accepted_tasks) − (AI_API + hosting + monitoring + QA + human_review + maintenance_cost)\`.
Do NOT claim ROI until pilot quantities and cost are measured. Board chooses a **hard spend cap and stop-loss** before any paid provider activation.

## 7. Accountability / single source of truth

- **One canonical plan:** this document in the Blumark24 OS repository. Any change requires a versioned review; do not create duplicate competing roadmaps.
- **Board:** strategic intent, spend/contract/signoff, acceptance of aggregate reports; no municipal PII access.
- **Defense / Blumark24 OS:** Core-facing corporate HR/employee task metadata, internal staff onboarding, reporting; protects the approved OS Design System.
- **Attack 1 / Services:** independent commercial agents; never inherits HSR privileges.
- **Attack 2 / SMART HSR:** HSR-owned tenant product, agent gateway, role enforcement, UAT and municipal customer acceptance.
- **Cross-cutting Security:** independent assurance, PDPL, incident and recoverability evidence, and approved release steps.
- **Operations cadence:** one executive board dashboard, one master dependency board, one exception-based risk digest. Close evidence links instead of repeating unverified readiness percentages.

**Single next action:** Approve the **data boundaries + role/access contract** for a synthetic pilot, alongside completing existing real G0 Firestore/B2 evidence. Do not deploy or connect Core to live SMART HSR data.

**References for regulatory review (do not treat this plan as certification):**
- SDAIA Personal Data Protection Law and foreign-transfer rules: https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL and https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/RegulationonPersonalDataTransferOutsidetheKingdom
- NCA Essential Cybersecurity Controls (ECC 2-2024): https://nca.gov.sa/en/regulatory-documents/controls-list/ecc/
