# Schema Audit v1 — Blumark24 OS
**Branch:** `claude/tenant-work-context-engine-1`  
**Date:** 2026-06-10  
**Scope:** Read-only inspection of migrations, production schema, and application code.  
**Method:** All findings are backed by direct file evidence (paths + line numbers cited below).

---

## Q1 — Does `employees.id` equal `auth.users.id` / `profiles.id`?

**Answer: YES, by application convention — but NOT enforced by the schema.**

### Schema definition

`final-production-schema.sql:151` and `004_full_schema.sql:94`:
```sql
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),   -- random UUID by default
  ...
```

`final-production-schema.sql:42` and `004_full_schema.sql:28`:
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  -- = auth.uid()
  ...
```

There is **no FK** `employees.id → auth.users(id)` or `employees.id → profiles(id)` in any migration.

### Where the convention is SET

`src/app/api/admin/create-user/route.ts:215–232` — the only code path that creates employee rows:
```typescript
const userId = createResp.data.user.id;   // = auth.users.id (line 182)

const empUpsert = await admin.from("employees").upsert(
  [{ id: userId, name, email, ... }],     // explicitly stamps id = auth.uid()
  { onConflict: "id" },
);
```

Because every employee row is inserted via this route with `id: userId`, the convention holds for all accounts created through the proper API path. Any employee created by direct SQL with a random UUID breaks the convention silently — there is no DB constraint to catch it.

### Summary

| Column | Value |
|--------|-------|
| `auth.users.id` | Supabase-assigned UUID |
| `profiles.id` | = `auth.users.id` (FK enforced) |
| `employees.id` | = `auth.users.id` by app convention; schema default is random UUID |
| FK constraint? | **No** — enforced by `create-user` route only |

---

## Q2 — Does `employees` have a `profile_id` or `user_id` column?

**Answer: Depends on which schema was applied first. The two schema sources disagree.**

### `final-production-schema.sql` (lines 150–165) — NO such column

```sql
CREATE TABLE IF NOT EXISTS public.employees (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  email            TEXT UNIQUE,
  role             TEXT NOT NULL DEFAULT 'موظف',
  ...
  -- NO user_id, NO profile_id
);
```

### `001_create_tables.sql` (lines 20–45) — HAS `user_id`

```sql
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,   -- present here
  full_name text NOT NULL,
  ...
);
```

### Live DB state

Both use `CREATE TABLE IF NOT EXISTS`. If `001_create_tables.sql` was applied first, the `user_id` column persists even after the production schema runs (it uses the existing table). If `final-production-schema.sql` was applied first, `user_id` is absent.

The `final-production-schema.sql` is the authoritative document for the runtime schema per its own header comment, and it does **not** reference `user_id` or `profile_id`. Later migrations (004–036) also do not add these columns.

**The two schema files are inconsistent.** The app resolves this ambiguity by treating `employees.id = auth.uid()` directly (see Q1) rather than relying on a `user_id` FK column.

---

## Q3 — Which code currently assumes `employees.id = auth.uid()`?

Five distinct locations:

### 3a. `src/lib/tenant/workContext.ts:74–78` *(this branch — new code)*
```typescript
const { data: emp } = await supabase
  .from("employees")
  .select("job_title, join_date, status")
  .eq("id", userId)          // userId = auth.uid() passed in by caller
  .maybeSingle();
```
Comment on line 73: "Own employees row — org-scoped record carrying job title, status, join date."

### 3b. `src/app/api/profile/update-self/route.ts:113–116` *(already merged)*
```typescript
// employees: name + phone. Scoped to the caller's own id AND organization
let q = admin.from("employees").update(employeeSync).eq("id", callerId);
if (callerOrgId) q = q.eq("organization_id", callerOrgId);
```
`callerId` is resolved from the caller's Bearer token → `auth.uid()`.

### 3c. `src/app/api/admin/create-user/route.ts:217` *(the convention setter)*
```typescript
{ id: userId, name, email, ... }   // userId = createResp.data.user.id = auth.uid()
```
This is the origin of the convention, not just a consumer.

### 3d. `src/hooks/useData.ts:548–553` *(already merged)*
```typescript
// "linked" when employees.id is present here; cross-tenant rows can never leak
// in, and matching is strictly by id (never by email).
async function fetchOrgProfileIds(): Promise<string[]> {
  const { data } = await supabase.from("profiles").select("id");
  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}
```
An employee is considered "linked" when `employees.id` appears in the set of `profiles.id` values returned by this query.

### 3e. `src/app/employees/page.tsx:68–73` *(already merged)*
```typescript
// Profile-linkage: an employee is "linked" when employees.id matches a
// profiles.id in THIS organization
const { ids: linkedProfileIds, loading: linkLoading } = useOrgProfileIds();
const needsLinkEmployee = (id: string) => !linkLoading && !linkedProfileIds.has(id);
```
`id` here is `employees.id`. The check succeeds only if `employees.id ∈ profiles.id` — i.e., if the convention holds.

---

## Q4 — Which tables have nullable `organization_id`?

**Migration 010** (`010_client_login_link.sql:25–27`) adds nullable `organization_id` to:
- `profiles`

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID
  REFERENCES public.organizations(id) ON DELETE SET NULL;
```

**Migration 011** (`011_tenant_isolation_phase_a.sql:57–66`) dynamically adds nullable `organization_id` to each of the following (if they exist):
- `clients`
- `tasks`
- `employees`
- `transactions`
- `invoices`
- `expenses`
- `activities`
- `projects`
- `strategy_phases`
- `board_members`
- `automations`
- `automation_logs`
- `messages`
- `notifications`

In all cases the ALTER TABLE uses:
```sql
'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organization_id UUID '
|| 'REFERENCES public.organizations(id) ON DELETE SET NULL'
```

No `NOT NULL` constraint — all of the above are nullable. They are backfilled to the internal org via the same migration but new rows could still arrive with NULL if the auto-stamp trigger fires with a caller who has no org.

---

## Q5 — Which tables lack `organization_id` entirely?

### SaaS meta-tables (by design — no org scoping needed)

| Table | Created in | Reason |
|-------|-----------|--------|
| `organizations` | 009 | *Is* the org table |
| `plans` | 009 | Platform-wide, owner-only |
| `plan_limits` | 009 | Platform-wide, owner-only |
| `subscriptions` | 009 | Links org to plan; no self-reference |
| `owner_audit_logs` | 009 | Platform audit log, owner-only |

### Utility tables (never added to any isolation loop)

| Table | Where defined | Gap |
|-------|--------------|-----|
| `system_settings` | `final-production-schema.sql:427` | Never appears in migrations 011 or 015 table lists; has no `organization_id`; global settings not yet tenant-scoped |

### Tables with `organization_id` as `PRIMARY KEY` (not a nullable FK)

| Table | PK definition |
|-------|--------------|
| `tenant_workspace_settings` | `organization_id UUID PRIMARY KEY REFERENCES organizations(id)` (`024_tenant_workspace_settings_and_manager_rbac.sql:18`) |

### Tables with `NOT NULL organization_id` (strongest enforcement)

These were created fresh with the column required from the start:

| Table | Migration | Definition |
|-------|----------|------------|
| `departments` | 019 / 020 | `organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE` |
| `teams` | 019 | same |
| `positions` | 019 | same |
| `employee_relations` | 019 | same |
| `executive_office_room_mappings` | 034 | same (per existing audit report) |

---

## Q6 — Which task/client fields are `TEXT` instead of `UUID` with FK enforcement?

### `tasks` table

Defined in `final-production-schema.sql:237–241` and `004_full_schema.sql:173–177`:

```sql
assignee_id      TEXT NOT NULL DEFAULT '',   -- should be UUID → employees.id
assignee_name    TEXT NOT NULL DEFAULT '',   -- denormalized mirror; no FK possible
assignee_avatar  TEXT,
client_id        TEXT,                       -- should be UUID → clients.id
client_name      TEXT,                       -- denormalized mirror
```

The RLS policy in `012_tenant_isolation_phase_b1.sql:158–160` confirms the TEXT comparison:
```sql
OR (public.get_my_role() = 'employee' AND assignee_id = auth.uid()::text)
```

`auth.uid()` is a UUID cast to TEXT for the comparison — brittle, no index on FK relationship.

### `clients` table

Defined in `final-production-schema.sql:202–203` and `004_full_schema.sql:140–141`:

```sql
account_manager_id   TEXT NOT NULL DEFAULT '',  -- should be UUID → employees.id
account_manager_name TEXT NOT NULL DEFAULT '',  -- denormalized mirror
```

### Impact

- No cascade cleanup when an employee is deleted — tasks retain the orphaned text ID
- No referential integrity check on insert — any string value is accepted
- The RLS `assignee_id = auth.uid()::text` comparison is semantically correct but relies on UUID string format consistency; a single trailing space or casing difference silently breaks the permission gate

---

## Q7 — RLS policies on employees, profiles, tasks, clients, departments, teams, employee_relations

### `profiles`
*Final state: migration 030 (line 107–120) + 027 (lines 74–77)*

| Command | Policy name | USING / WITH CHECK |
|---------|-------------|---------------------|
| SELECT | `"profiles: select"` | `auth.uid() = id OR is_owner() OR get_my_role() = 'super_admin' OR (organization_id IS NOT NULL AND organization_id = current_org_id())` |
| SELECT | `"profiles: owner select"` | `is_owner()` (additive; from 010) |
| INSERT | `"profiles: insert own"` | WITH CHECK: `auth.uid() = id` |
| UPDATE | `"profiles: update"` | USING + WITH CHECK: `auth.uid() = id OR get_my_role() = 'super_admin'`; column guard via `profiles_block_protected_updates` trigger (027) |
| DELETE | `"profiles: delete"` | `get_my_role() = 'super_admin'` |

### `employees`
*Final state: migration 012 (`012_tenant_isolation_phase_b1.sql:248–275`)*

| Command | Policy name | USING / WITH CHECK |
|---------|-------------|---------------------|
| SELECT | `"employees: org select"` | `organization_id = current_org_id() OR is_owner() OR get_my_role() = 'super_admin'` |
| INSERT | `"employees: org insert"` | `is_owner() OR get_my_role() = 'super_admin'` |
| UPDATE | `"employees: org update"` | USING + WITH CHECK: `is_owner() OR get_my_role() = 'super_admin'` |
| DELETE | `"employees: org delete"` | `is_owner() OR get_my_role() = 'super_admin'` |

### `tasks`
*Final state: migration 015, section 7 (`015_tenant_isolation_phase_b2.sql:479–498`)*

| Command | Policy name | USING / WITH CHECK |
|---------|-------------|---------------------|
| SELECT | `"tasks: org select"` | `organization_id = current_org_id() OR is_owner() OR get_my_role() = 'super_admin'` |
| INSERT | `"tasks: org insert"` | `is_owner() OR super_admin OR (same-org AND (manager role OR employee with assignee_id = auth.uid()::text))` |
| UPDATE | `"tasks: org update"` | Same as INSERT (USING + WITH CHECK) |
| DELETE | `"tasks: org delete"` | `is_owner() OR super_admin OR (same-org AND manager role)` |

### `clients`
*Final state: migration 015, section 7 (`015_tenant_isolation_phase_b2.sql:507–522`)*

| Command | Policy name | USING / WITH CHECK |
|---------|-------------|---------------------|
| SELECT | `"clients: org select"` | `organization_id = current_org_id() OR is_owner() OR get_my_role() = 'super_admin'` |
| INSERT | `"clients: org insert"` | `is_owner() OR super_admin OR (same-org AND role IN ('board_member','attack_manager','organization_manager'))` |
| UPDATE | `"clients: org update"` | Same as INSERT (USING + WITH CHECK) |
| DELETE | `"clients: org delete"` | Same as INSERT |

### `departments`
*Final state: migration 030 (`20260525143000_030_saas_rls_hardening.sql:148–187`)*

| Command | Policy name | USING / WITH CHECK |
|---------|-------------|---------------------|
| SELECT | `"departments: org select"` | `organization_id = current_org_id() OR is_owner() OR get_my_role() = 'super_admin'` |
| INSERT | `"departments: org insert"` | `is_owner() OR super_admin OR (same-org AND can_manage_tenant_org() AND can_insert_department(org_id))` |
| UPDATE | `"departments: org update"` | `is_owner() OR super_admin OR (same-org AND can_manage_tenant_org())` |
| DELETE | `"departments: org delete"` | Same as UPDATE |

### `teams`
*Final state: migration 019 (`019_tenant_org_structure.sql:189–215`)*

| Command | Policy name | USING / WITH CHECK |
|---------|-------------|---------------------|
| SELECT | `"teams: org select"` | `organization_id = current_org_id() OR is_owner() OR get_my_role() = 'super_admin'` |
| INSERT | `"teams: org insert"` | `is_owner() OR super_admin OR (same-org AND can_manage_tenant_org())` |
| UPDATE | `"teams: org update"` | Same as INSERT (USING + WITH CHECK) |
| DELETE | `"teams: org delete"` | Same as INSERT |

### `employee_relations`
*Final state: migration 019 (`019_tenant_org_structure.sql:252–284`)*

| Command | Policy name | USING / WITH CHECK |
|---------|-------------|---------------------|
| SELECT | `"employee_relations: org select"` | `organization_id = current_org_id() OR is_owner() OR get_my_role() = 'super_admin'` |
| INSERT | `"employee_relations: org insert"` | `is_owner() OR super_admin OR (same-org AND can_manage_tenant_org())` |
| UPDATE | `"employee_relations: org update"` | Same as INSERT (USING + WITH CHECK) |
| DELETE | `"employee_relations: org delete"` | Same as INSERT |

---

## Q8 — Does PR #280 contain migration files? Which tables do they touch?

### PR identification

`gh` CLI is unavailable in this environment. The last confirmed-merged PR visible in git log is **#277** (`4c8eb08 Merge pull request #277`). The current open branch `claude/tenant-work-context-engine-1` contains 7 commits ahead of `main` and is the most recent unmerged branch; it is the candidate for PR #280. Exact PR number cannot be confirmed without GitHub API access.

### Files changed vs `main` (`git diff main...HEAD --name-only`)

```
src/app/employees/page.tsx
src/app/settings/page.tsx
src/components/layout/Header.tsx
src/components/settings/SmartProfileModal.tsx
src/hooks/useMyWorkContext.ts
src/lib/tenant/workContext.ts
```

**No migration files are present in this diff.**

### Tables the code changes READ from

`src/lib/tenant/workContext.ts` (lines 74–105):

| Table | Operation | Filter | What is read |
|-------|-----------|--------|-------------|
| `employees` | SELECT | `.eq("id", userId)` | `job_title, join_date, status` |
| `employee_relations` | SELECT | `.eq("employee_id", userId)` | `department_id, manager_id` |
| `departments` | SELECT | `.eq("id", rel.department_id)` | `name` |
| `employees` (manager) | SELECT | `.eq("id", rel.manager_id)` | `name` |

All are read-only queries. No INSERTs, UPDATEs, or DELETEs are performed by this branch.

---

## Q9 — Is PR #280 safe to merge, or should it stay on hold?

### Verdict: **SAFE**

### Reasoning

**No schema changes.** Zero migration files in the diff. No tables added, no columns added or removed, no indexes changed.

**No RLS changes.** No policy is dropped or created. The tables queried (`employees`, `employee_relations`, `departments`) already have their final-state org-scoped RLS in place (migrations 012, 019, 030). This branch does not widen any access path.

**The `employees.id = auth.uid()` assumption is pre-existing production behavior.** The same assumption was already shipped in:
- `src/app/api/profile/update-self/route.ts:114` (merged before this branch)
- The entire `useOrgProfileIds` + employees linkage check in `useData.ts` and `employees/page.tsx` (merged before this branch)

This PR is consistent with existing shipped code, not introducing the assumption for the first time.

**Worst-case failure mode is a silent empty-state, not a data leak.** If an employee row was somehow created with a random `id` (bypassing the create-user API), `workContext.ts` returns `EMPTY_WORK_CONTEXT` and the UI renders the professional empty-state. No other tenant's data is exposed.

**The `maybeSingle()` + null-safe pattern is correct.** All three downstream reads (`emp`, `rel`, `dept`, `mgr`) are guarded with `?.` optional chaining; `resolveMyWorkContext` returns `EMPTY_WORK_CONTEXT` on any error. No crash path exists.

### Outstanding risks (pre-existing, tracked — do not block this merge)

| ID | Risk | Pre-existing? | Blocking? |
|----|------|---------------|-----------|
| P0-1 | `tasks.assignee_id`, `tasks.client_id`, `clients.account_manager_id` are TEXT with no FK | Yes | No |
| P1-3 | `workContext.ts` department + manager reads rely solely on RLS (no app-layer org guard) | Introduced here | No — RLS is correctly enforced; defense-in-depth improvement, not a security gap |
| P1-4 | No FK: `employees.id → auth.users.id` | Yes | No |

The P1-3 item is introduced by this branch but is a defense-in-depth gap, not a security vulnerability. RLS is correctly in place. The fix (add `.eq("organization_id", callerOrgId)` to the department and manager reads) is low-risk and can be done in a follow-on PR.

---

## Final Recommendation

```
SAFE — merge `claude/tenant-work-context-engine-1` (PR #280 candidate).
Follow-on: Add `.eq("organization_id", callerOrgId)` defense-in-depth
guards to the department and manager name reads in workContext.ts (P1-3).
```
