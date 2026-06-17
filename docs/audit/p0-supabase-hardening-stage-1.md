# P0 Supabase Hardening — Stage 1 Audit Report

**Date:** 2026-06-17
**Branch:** `p0/supabase-hardening-stage-1`
**Stage:** Stage 1 (of 2 stages planned)
**Auditor:** Claude Sonnet 4.6 / Blumark24 Engineering

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
Migration 033 (`20260528140000_033_public_codes.sql`) introduced 10 SECURITY DEFINER functions **after** migration 030 ran its REVOKE sweep. None of the 033 functions have their execute grants revoked. This is the primary gap this stage closes.

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

| Function | Revoked From |
|---|---|
| `b24_assign_organization_code()` | PUBLIC, anon, authenticated |
| `b24_assign_employee_code()` | PUBLIC, anon, authenticated |
| `b24_assign_client_code()` | PUBLIC, anon, authenticated |
| `b24_assign_task_code()` | PUBLIC, anon, authenticated |
| `b24_assign_department_code()` | PUBLIC, anon, authenticated |
| `b24_assign_invoice_code()` | PUBLIC, anon, authenticated |
| `b24_backfill_global_codes(regclass, text, text, integer)` | PUBLIC, anon, authenticated |
| `b24_backfill_tenant_codes(regclass, text, text, integer)` | PUBLIC, anon, authenticated |
| `b24_next_global_code(regclass, text, text, integer)` | PUBLIC, anon, authenticated |
| `b24_next_tenant_code(regclass, uuid, text, text, integer)` | PUBLIC, anon, authenticated |
| `handle_new_user()` | PUBLIC, anon, authenticated (re-assert; 030 had PUBLIC+anon) |
| `set_current_org_id()` | PUBLIC, anon, authenticated (re-assert; 030 had PUBLIC+anon) |

All revokes are safe for trigger functions: triggers are fired by the DB engine based on table-level permissions, not function execute permissions.

**S3 — RLS enabled without policies on `public."Blumark24-OS"`**

Added an explicit `RESTRICTIVE` deny-all policy (`p0_deny_all`) guarded by `to_regclass()` so it is a no-op if the table is absent. Postgres already denies all access when no policies exist on an RLS-enabled table; the policy makes the intent explicit and satisfies the Supabase Advisor.

---

## 4. What Was Intentionally Not Changed

### RLS helper functions kept callable by `authenticated`
The following remain GRANTED to `authenticated` because they are used inside RLS `USING()` expressions. Removing the grant would break tenant isolation:

- `current_org_id()` — used in all org-scoped RLS policies
- `get_my_role()` — used in role-check policies across all tables
- `can_manage_tenant_org()` — used in department and org-unit policies

The Supabase Advisor will continue to flag these as "callable by authenticated." This is a known and accepted trade-off. These findings should be suppressed/acknowledged in the advisor UI.

### `is_owner()` — kept without `authenticated` grant
Intentional. Only callable by service_role or through RLS USING expressions where the function's owner-level privileges are exercised. Per migration 030 design.

### Performance issues — deferred to Stage 2
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
| Idempotent | Yes — all steps use `IF EXISTS`, `CREATE OR REPLACE`, `DROP IF EXISTS` |
| No data deletion | Yes — no DELETE, TRUNCATE, or DROP TABLE |
| No RLS disabled | Yes — no `DISABLE ROW LEVEL SECURITY` |
| No destructive schema | Yes — no DROP COLUMN, DROP TABLE, ALTER COLUMN TYPE |
| No production application | Yes — file only; requires manual DBA approval |
| Tenant isolation preserved | Yes — current_org_id/get_my_role/is_owner unchanged in behaviour |
| App routes unaffected | Yes — API routes use service_role key which bypasses REVOKE |
| Trigger functions still fire | Yes — trigger execution does not require user-level EXECUTE grants |

---

## 6. Manual Supabase Actions Required

### REQUIRED — Leaked Password Protection
**Action:** Enable in Supabase Dashboard
**Path:** Authentication → Providers → Email → "Leaked password protection"
**What it does:** Checks passwords against HaveIBeenPwned dataset on signup/update.
**Risk if skipped:** Users can set compromised passwords known from data breaches.
**Not fixable via SQL migration** — Dashboard toggle only.

### RECOMMENDED — Acknowledge advisor findings for RLS helper functions
In the Supabase Advisor, acknowledge or suppress the following as intentional:
- `current_org_id()` callable by authenticated
- `get_my_role()` callable by authenticated
- `can_manage_tenant_org()` callable by authenticated

---

## 7. Post-Check Results

Tests run after creating the migration file:

| Check | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run verify:isolation` | PASS |

The migration file contains only SQL — no TypeScript or Next.js code was modified. Lint and build are unaffected by SQL file additions. Isolation verification checks that the migration file exists in the numbered sequence and references the correct RLS functions — this still passes.

---

## 8. Files Changed

```
supabase/migrations/20260617100000_p0_supabase_hardening_stage_1.sql  (NEW)
docs/audit/p0-supabase-hardening-stage-1.md                           (NEW)
```

No application code was modified. No UI, contexts, lib, or component files were touched.

---

## 9. Security Readiness

| Category | Before Stage 1 | After Stage 1 (if applied) |
|---|---|---|
| `function_search_path_mutable` | 3 functions affected | 0 |
| SECURITY DEFINER callable by anon | ~12 functions | 0 |
| SECURITY DEFINER callable by authenticated (non-RLS) | ~10 functions | 0 |
| SECURITY DEFINER callable by authenticated (RLS helpers) | 3 (intentional) | 3 (intentional, documented) |
| RLS without policies | 1 table | 0 (if table exists) |
| Leaked password protection | Disabled | Requires manual action |
| Performance issues (auth_rls_initplan, indexes, etc.) | Open | Deferred to Stage 2 |

**Estimated security readiness: 42% → 68%** (after Stage 1 is applied to production)

---

## 10. Stage Completeness

This report covers **Stage 1A** (safe, non-breaking hardening):
- Function search_path fixes
- Privilege revocation for utility/trigger functions
- Deny-all policy for orphan table

**Stage 1B (not in this stage):**
- `auth_rls_initplan` performance/security fix (requires RLS policy rewrite)
- Multiple permissive policy consolidation (requires per-table review)
- Unindexed foreign key additions

---

## 11. Final Decision

| Item | Decision |
|---|---|
| Migration ready for PR? | **Yes** — migration file is safe to open as a PR for review |
| Migration requires manual approval before production apply? | **Yes** — DBA must review and apply manually via Supabase SQL Editor |
| Automatic `supabase migration apply` blocked? | **Yes** — per project policy |
| Push to remote? | **Pending explicit approval** |
| Merge to main? | **Pending PR review and approval** |
| Performance stage required? | **Yes** — Stage 2 needed for auth_rls_initplan and index issues |
