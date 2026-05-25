# Blumark24 OS — Module Connection Audit (Read-Only)

**Date:** 2026-05-25  
**Scope:** Owner Panel, Customer Dashboard, Employees, Tasks, Organization Structure, Departments, Finance, Reports, AI, Automations, Settings, Subscriptions/Plans  
**Rules:** No file edits, no redesign, no migrations, no auth/route changes — inspection and reporting only.

---

## Executive Summary

Blumark24 OS has **two surfaces**:

| Surface | Routes | Data layer |
|---------|--------|------------|
| Tenant Workspace | `/dashboard`, `/employees`, `/tasks`, `/org`, … | `src/hooks/useData.ts`, `src/lib/org/structureDb.ts` |
| Owner Command Center | `/owner/*` | `src/app/owner/_lib/ownerQueries.ts` |

**Connection between surfaces is indirect (database-only):** Owner creates orgs/subscriptions → `TenantWorkspaceContext` reads plan → `packageFeatures.ts` gates modules. No tenant UI links to `/owner`.

**Maturity:**

- **Production-ready (tenant):** Dashboard, Employees, Tasks, Org/Departments, Finance (transactions), Reports (partial), Automations (partial), Settings (core)
- **Mixed (owner):** Organizations page wired; dashboard home still has static preview widgets
- **Placeholder (owner):** Billing, Usage, Security (partial); Plans/Subscriptions list read-only

---

## Section Audit Matrix

| Section | Real Supabase | Mock/static | Org scoped | Owner connection |
|---------|---------------|-------------|------------|------------------|
| Owner Panel | Partial (orgs/plans/subs real; KPI/AI/WhatsApp mock) | `_data.ts` preview | Platform-wide (`is_owner()`) | N/A |
| Customer Dashboard | Yes (`useData` hooks) | Chart previous year = 0 | RLS + `current_org_id()` | Plan gating only |
| Employees | Yes | Static dept dropdown | RLS | `maxEmployees` not enforced in UI |
| Tasks | Yes | UI config only | RLS | None |
| Org / Departments | Yes | Plan caps client-side | RLS + write stamp | Plan limits bridge |
| Finance | Yes (`transactions`) | Fund split ratios hardcoded | RLS | Advanced plan gate |
| Reports | Yes | Period label cosmetic (pre-fix) | RLS | Basic+ gate |
| AI | Partial (KPI + API) | Fallback template | RLS on KPI data | Owner usage mock |
| Automations | Partial (2 rules mutate DB) | Rule metadata static | RLS | Advanced gate |
| Settings | Yes (core tabs) | Integration toasts | Partial (`getAllProfiles` RLS-only) | None |
| Subscriptions (tenant) | N/A | Invisible plan gating | Via context API | Owner-managed |

---

## Broken / Inactive Controls (Pre-Wiring)

### Owner Panel
- Dashboard org row: **عرض / ترقية / تعليق** disabled
- Plans page: all write actions disabled
- Subscriptions page: all row actions disabled
- Billing / Usage / Security: placeholders
- Sidebar: Roles / Settings buttons without href

### Tenant Workspace
- Dashboard **عرض الكل**: no handler
- Tasks **مهمة جديدة**: super_admin only (not `manage_tasks`)
- Reports: strategy tab empty; period filter cosmetic
- Settings integrations: toast-only

---

## Required Backend Tables (by section)

| Section | Tables |
|---------|--------|
| Owner | `organizations`, `plans`, `plan_limits`, `subscriptions`, `owner_audit_logs`, `profiles` |
| Tenant core | `clients`, `tasks`, `employees`, `transactions`, `projects`, `activities` |
| Org structure | `departments`, `teams`, `positions`, `employee_relations` |
| Automations | `automations`, `automation_logs` |
| Settings | `tenant_workspace_settings`, `system_settings`, `profiles`, `role_permissions` |

---

## Risk Register

| Priority | Item | Impact |
|----------|------|--------|
| P0 | RLS not applied in prod | Cross-tenant leak |
| P1 | `getAllProfiles()` without app org filter | Settings users tab exposure |
| P1 | AI API without usage limits | Cost exposure |
| P2 | Plan limits client-side only | Cap bypass via direct API |
| P2 | Automation Run All | Bulk unintended updates |

---

## Safe Phased Implementation Plan

| Phase | Scope | Risk |
|-------|-------|------|
| **A** | This audit + `verify:isolation` script | None |
| **B** | Low-risk UI wiring (links, permissions, filters) | Low |
| **C** | `ai_usage_logs` + owner usage aggregates | Medium (additive schema) |
| **D** | Plan limit DB triggers + AI cap | Medium (blocks over-cap inserts) |
| **E** | Automations dry-run + effects (one at a time) | Medium |
| **F** | Billing schema design only | High if Stripe wired early |

**Do not change:** design, sidebar, customer routes, auth architecture, visual identity.

---

## Verification

Run locally (no Supabase credentials required for codebase checks):

```bash
npm run verify:isolation
```

Optional live checks: set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then re-run. Manual QA: two org accounts must not see each other's data.

---

## Conclusion

Tenant modules are substantially on real Supabase data with RLS isolation. Owner org/subscription management works on `/owner/organizations`; dashboard monitoring widgets remain Phase 1 static preview. Safest wins: verification (Phase A) then low-risk wiring (Phase B) before schema or enforcement changes.
