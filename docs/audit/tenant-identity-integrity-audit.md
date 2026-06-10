# Tenant Identity Integrity — Dry-Run Audit

**Scope:** Read-only diagnostics for the invariant enforced by
`src/lib/api/ensureEmployee.ts`. **Nothing here mutates data.** Run each query
as the service role (e.g. Supabase SQL editor) to size the problem before any
backfill is approved.

## The invariant

Every app user inside a tenant must have:

- an `auth.users` row,
- a `profiles` row (`id = auth.users.id`),
- an `employees` row (`id = profiles.id`),
- the **same** `organization_id` on profiles and employees,
- synced `email`, `name`, and active `status`.

`ensureEmployeeRow()` repairs this for a single user on three code paths
(self profile save, admin user edit, owner provisioning). The queries below find
rows that pre-date that helper and would still need a one-time backfill.

> Replace nothing destructive. These are all `SELECT`s.

### 1. Profiles WITHOUT an employees row (the core gap)

```sql
select p.id, p.email, p.name, p.role, p.organization_id
from public.profiles p
left join public.employees e on e.id = p.id
where e.id is null
order by p.organization_id, p.email;
```

Typically these are owner-provisioned `organization_manager` accounts.

### 2. Employees WITHOUT a profiles row (orphans, e.g. after auth user delete)

```sql
select e.id, e.email, e.name, e.organization_id
from public.employees e
left join public.profiles p on p.id = e.id
where p.id is null
order by e.organization_id, e.email;
```

### 3. organization_id MISMATCH between the two rows

```sql
select p.id, p.email,
       p.organization_id as profile_org,
       e.organization_id as employee_org
from public.profiles p
join public.employees e on e.id = p.id
where p.organization_id is distinct from e.organization_id
order by p.organization_id;
```

`ensureEmployeeRow` heals a NULL employee org to the profile's org, but never
moves a non-null mismatch (no cross-tenant move) — those surface here for
manual review.

### 4. NULL organization_id on either table

```sql
-- profiles with no org
select 'profile' as src, id, email from public.profiles where organization_id is null
union all
-- employees with no org
select 'employee' as src, id, email from public.employees where organization_id is null
order by src, email;
```

### 5. email / name / status drift (rows that exist but disagree)

```sql
select p.id,
       p.email as profile_email, e.email as employee_email,
       p.name  as profile_name,  e.name  as employee_name,
       p.is_active as profile_active, e.status as employee_status
from public.profiles p
join public.employees e on e.id = p.id
where p.email is distinct from e.email
   or p.name  is distinct from e.name
   or (p.is_active is true  and e.status is distinct from 'نشط')
   or (p.is_active is false and e.status is distinct from 'غير_نشط')
order by p.organization_id;
```

### 6. Per-tenant summary (size the gap across 1000+ orgs)

```sql
select p.organization_id,
       count(*)                              as profiles,
       count(e.id)                           as employees_linked,
       count(*) filter (where e.id is null)  as missing_employees
from public.profiles p
left join public.employees e on e.id = p.id
group by p.organization_id
order by missing_employees desc;
```

## Backfill (NOT executed here)

Once the counts above are reviewed and a backfill is explicitly approved, the
safe repair is an **additive, idempotent insert** of the missing employees rows
mirroring `ensureEmployeeRow` (id = profiles.id, organization_id =
profiles.organization_id, email/name synced, status from is_active, role
`'employee'` — constraint-safe — department `'الإدارة'`, job_title from the role
label, join_date = today; **never** writing phone/salary, **never** deleting).
Do not run it without sign-off.
