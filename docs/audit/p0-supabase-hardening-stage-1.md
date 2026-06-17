# P0 Supabase Hardening — Stage 1A Audit Report

**Date:** 2026-06-17  
**Branch:** `p0/supabase-hardening-stage-1`  
**Stage:** Stage 1A — safe, non-breaking Supabase hardening  
**Auditor:** Claude Sonnet 4.6 / Blumark24 Engineering, reviewed by GPT-5.5 Thinking

---

## 1. Pre-Check Results

| Check | Result |
|---|---|
| Working directory | `C:\Users\DELL\Desktop\Blumark24-OS-FRESH` |
| Branch at start | `main` |
| `git status --short` | clean (empty) |
| `npm run lint` | PASS — no ESLint warnings or errors |
| `npm run build` | PASS — 41 routes compiled successfully |
| `npm run verify:isolation` | PASS — 27 checks passed |

All pre-checks passed before any edits were made.

---

## 2. What Was Checked

### Migration file inventory
All 33 migration files were inspected in lexicographic apply order:
`001_*` → `027_*` → `2026MMDD*`

### Functions reviewed
| Function | Defined in | search_path set | SECURITY DEFINER | REVOKE in 030 |
|---|---|---|---|---|
| `get_my_role()` | 004 (with), 008 (without) | Regression in 008 | Yes | PUBLIC+anon revoked, authenticated granted |
| `handle_new_user()` | 004 | Yes | Yes | PUBLIC+anon revoked |
| `set_updated_at()` | 019 (without), 024 (with) | Inconsistent | No | Not in 030 scope |
| `set_current_org_id()` | 012, 015 | Yes | No (trigger) | PUBLIC+anon revoked |
| `current_org_id()` | 011 | Yes | Yes | PUBLIC+anon revoked, authenticated granted |
| `is_owner()` | 009 | Yes | Yes | PUBLIC+anon revoked, NOT granted authenticated |
| `can_manage_tenant_org()` | 030 (inline) | Yes | Yes | PUBLIC+anon revoked, authenticated granted |
| `b24_assign_*` (6 functions) | 033 | Yes | Yes | **No REVOKE** |
| `b24_backfill_*` (2 functions) | 033 | Yes | Yes | **No REVOKE** |
| `b24_next_*` (2 functions) | 033 | Yes | Yes | **No REVOKE** |

### Key finding
Migration 033 (`20260528140000_033_public_codes.sql`) introduced 10 SECURITY DEFINER functions **after** migration 030 ran its REVOKE sweep. None of the 033 functions had their execute grants revoked. This is the primary gap this stage closes.

---

## 3. What Was Changed

### New migration file
`supabase/migrations/20260617100000_p0_supabase_hardening_stage_1.sql`

### Changes inside the migration

**S1 — Fix `function_search_path_mutable`**

| Function | Action |
|---|---|
| `handle_new_user()` | `CREATE OR REPLACE` with `SET search_path = public` re-asserted |
| `set_updated_at()` | `CREATE OR REPLACE` with `SET search_path = public` re-asserted |
| `get_my_role()` | `CREATE OR REPLACE` with `SET search_path = public` re-asserted (regression from 008 fixed) |

**S2 — REVOKE direct execute on SECURITY DEFINER functions**

| Function | Revoked From | service_role status |
|---|---|---|
| `b24_assign_organization_code()` | PUBLIC, anon, authenticated | No direct grant; trigger-only |
| `b24_assign_employee_code()` | PUBLIC, anon, authenticated | No direct grant; trigger-only |
| `b24_assign_client_code()` | PUBLIC, anon, authenticated | No direct grant; trigger-only |
| `b24_assign_task_code()` | PUBLIC, anon, authenticated | No direct grant; trigger-only |
| `b24_assign_department_code()` | PUBLIC, anon, authenticated | No direct grant; trigger-only |
| `b24_assign_invoice_code()` | PUBLIC, anon, authenticated | No direct grant; trigger-only |
| `b24_backfill_global_codes(regclass, text, text, integer)` | PUBLIC, anon, authenticated | Explicit `GRANT EXECUTE` |
| `b24_backfill_tenant_codes(regclass, text, text, integer)` | PUBLIC, anon, authenticated | Explicit `GRANT EXECUTE` |
| `b24_next_global_code(regclass, text, text, integer)` | PUBLIC, anon, authenticated | Explicit `GRANT EXECUTE` |
| `b24_next_tenant_code(regclass, uuid, text, text, integer)` | PUBLIC, anon, authenticated | Explicit `GRANT EXECUTE` |
| `handle_new_user()` | PUBLIC, anon, authenticated | No direct grant; trigger-only |
| `set_current_org_id()` | PUBLIC, anon, authenticated | No direct grant; trigger-only |

Notes:
- `service_role` bypasses RLS, but function `EXECUTE` privileges still apply.
- Admin/helper functions that may be called by service/admin contexts are explicitly granted to `service_role`.
- Trigger functions are intentionally not directly granted because they should run only through table/auth triggers.

**S3 — RLS enabled without policies on `public."Blumark24-OS"`**

Added an explicit `RESTRICTIVE` deny-all policy (`p0_deny_all`) guarded by `to_regclass()` so it is a no-op if the table is absent. Postgres already denies all access when no policies exist on an RLS-enabled table; the policy makes the intent explicit and should address the Supabase Advisor finding.

---

## 4. What Was Intentionally Not Changed

### RLS helper functions kept callable by `authenticated`
The following remain GRANTED to `authenticated` because they are used inside RLS `USING()` expressions. Removing the grant would break tenant isolation:

- `current_org_id()` — used in all org-scoped RLS policies
- `get_my_role()` — used in role-check policies across all tables
- `can_manage_tenant_org()` — used in department and org-unit policies

The Supabase Advisor will continue to flag these as "callable by authenticated." This is a known and accepted trade-off. These findings should be acknowledged only after confirming tenant isolation remains intact.

### `is_owner()` — kept without `authenticated` grant
Intentional. Only callable by service/admin contexts or through RLS `USING()` expressions where the function owner privileges are exercised. Per migration 030 design.

### Performance issues — deferred to later stages
The following Supabase Advisor performance findings require deeper investigation and are deferred:

- `auth_rls_initplan` — wrapping subqueries in RLS policies with `(SELECT ...)` to avoid re-evaluation per row. Requires policy-by-policy review.
- Multiple permissive policies — consolidation requires careful behavioural testing.
- Duplicate indexes — requires index audit cross-referencing migration history.
- Unindexed foreign keys — requires FK list generation and index additions.

### Leaked password protection — manual action required
This is a Supabase Auth Dashboard setting, not configurable via SQL migration. See Section 6.

---

## 5. Migration Safety Analysis

| Criterion | Status |
|---|---|
| Idempotent | Yes — guarded by `IF EXISTS`, `CREATE OR REPLACE`, `DROP IF EXISTS`, and role-existence checks |
| No data deletion | Yes — no DELETE, TRUNCATE, or DROP TABLE |
| No RLS disabled | Yes — no `DISABLE ROW LEVEL SECURITY` |
| No destructive schema | Yes — no DROP COLUMN, DROP TABLE, ALTER COLUMN TYPE |
| No production application | Yes — file only; requires manual DBA approval |
| Tenant isolation preserved | Expected — `current_org_id`, `get_my_role`, and `can_manage_tenant_org` remain callable by authenticated |
| App routes unaffected | Expected — direct user execution is revoked; service/admin helper execution is explicitly granted where needed |
| Trigger functions still fire | Expected — trigger execution is attached to table/auth triggers and does not require direct user-level EXECUTE grants |

Important correction from first PR version:
`service_role` bypasses RLS, but it does **not** automatically bypass function `EXECUTE` revokes. The migration now explicitly grants `service_role` for admin/helper functions that may need direct execution.

---

## 6. Manual Supabase Actions Required

### REQUIRED — Leaked Password Protection
**Action:** Enable in Supabase Dashboard  
**Path:** Authentication → Providers → Email → "Leaked password protection"  
**What it does:** Checks passwords against HaveIBeenPwned dataset on signup/update.  
**Risk if skipped:** Users can set compromised passwords known from data breaches.  
**Not fixable via SQL migration** — Dashboard toggle only.

### REQUIRED — Manual SQL review before production apply
The migration must be reviewed before being pasted or applied in Supabase production. Do not run automatic migration apply for this stage.

### RECOMMENDED — Re-run Supabase Advisors after apply
After manual approval and application:
- Re-run Supabase Security Advisor.
- Re-run Supabase Performance Advisor.
- Confirm the intended remaining findings for RLS helper functions.

---

## 7. Test Results

Tests reported before the first PR push:

| Check | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run verify:isolation` | PASS |

The service_role correction changed SQL/docs only. Before merging or applying production SQL, re-run:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run verify:isolation
```

---

## 8. Files Changed

```text
supabase/migrations/20260617100000_p0_supabase_hardening_stage_1.sql  (NEW)
docs/audit/p0-supabase-hardening-stage-1.md                           (NEW)
```

No application code was modified. No UI, contexts, lib, or component files were touched.

---

## 9. Security Readiness

| Category | Before Stage 1A | After Stage 1A, if reviewed and applied |
|---|---|---|
| `function_search_path_mutable` | 3 functions affected | Expected 0 |
| SECURITY DEFINER callable by anon | ~12 functions | Expected 0 for targeted functions |
| SECURITY DEFINER callable by authenticated (non-RLS) | ~10 functions | Expected 0 for targeted functions |
| SECURITY DEFINER callable by authenticated (RLS helpers) | 3 intentional | 3 intentional, documented |
| RLS without policies | 1 table | Expected 0 if table exists |
| Leaked password protection | Disabled | Requires manual Dashboard action |
| Performance issues | Open | Deferred |

**Conservative readiness estimate:** 42% → 50–55% after manual review, production apply, leaked password protection, and advisor re-check.

This migration alone does not make the platform 1000-client ready.

---

## 10. Stage Completeness

This report covers **Stage 1A** only:
- Function search_path fixes
- Privilege revocation for utility/trigger functions
- Explicit `service_role` grants for admin/helper functions
- Deny-all policy for orphan table

Not included in Stage 1A:
- `auth_rls_initplan` performance/security optimization
- Multiple permissive policy consolidation
- Duplicate index cleanup
- Foreign-key index additions
- Live tenant isolation test
- Production migration application

---

## 11. Final Decision

| Item | Decision |
|---|---|
| Migration ready for PR review? | **Yes** — after service_role grant correction |
| Migration ready for production apply? | **No** — requires manual SQL review and explicit approval |
| Automatic `supabase migration apply` allowed? | **No** — blocked by project policy |
| Merge to main? | Pending final review and checks |
| Production apply? | Pending separate explicit approval |
| Next stage required? | Yes — tenant isolation live test and advisor re-check after Stage 1A |
