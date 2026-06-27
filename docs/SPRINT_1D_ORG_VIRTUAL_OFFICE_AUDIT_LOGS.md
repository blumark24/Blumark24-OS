# Sprint 1D — Org + Virtual Office Audit Logs (Stop-and-Report)

Date: 2026-06-27
Scope: documentation only. No product code, RLS, middleware, Supabase
migrations, or API routes were modified. No secrets logged. No mock data.

## Outcome

**Stopped and reported.** A safe existing audit mechanism for **tenant-driven**
changes does not exist. Per the sprint's safety rule ("If no existing
audit-log table/helper exists, do not create migrations in this sprint.
Instead, stop and write a short report explaining what is missing"), no
product code was changed.

## What Changed

- `docs/SPRINT_1D_ORG_VIRTUAL_OFFICE_AUDIT_LOGS.md` (this file).

## What Is Logged (today, before this sprint)

The only audit-log table in the project is `public.owner_audit_logs`
(created in `supabase/migrations/009_owner_command_center_tables.sql`).

| Field | Type |
|---|---|
| `id` | uuid PK |
| `owner_email` | text NOT NULL |
| `action` | text NOT NULL |
| `target_type` | text |
| `target_id` | uuid |
| `metadata` | jsonb (default `{}`) |
| `created_at` | timestamptz |

RLS on `owner_audit_logs`:

- SELECT: `USING (public.is_owner())`
- INSERT: `WITH CHECK (public.is_owner())`
- No UPDATE / no DELETE policies (immutable by design).

`public.is_owner()` checks `auth.jwt() ->> 'email' IN
('blumark24@gmail.com', 'blumark.sa@gmail.com')`.

Existing writers:

- `src/app/owner/_lib/planMutations.ts` — `logPlanAction()` (owner panel
  plan edits)
- `src/app/api/owner/reset-client-password/route.ts`
- `src/app/api/admin/delete-user/route.ts` (via `verifyOwnerBearer`)
- `src/lib/api/ownerServerCommon.ts` (owner-only helpers)

In short: **`owner_audit_logs` records actions performed *by the platform
owner*, gated by an allowlist of two emails.**

## What Is Not Logged

- Org structure mutations performed by a tenant manager/admin
  (`src/lib/org/structureDb.ts`):
  - `createDepartment`, `updateDepartment`, `deleteDepartment`
  - `createTeam`, `updateTeam`, `deleteTeam`
  - `createPosition`, `updatePosition`, `deletePosition`
  - `assignEmployeeToOrgUnit`, `upsertEmployeeRelation`,
    `deleteEmployeeRelation`
- Virtual Office room mapping mutations performed in a tenant session
  (`src/lib/tenant/executiveOfficeRoomMappings.ts`,
  `src/app/api/tenant/executive-office/room-mappings/route.ts`):
  - `replaceExecutiveOfficeRoomMapping`
  - `updateExecutiveOfficeRoomMapping`
  - `deactivateExecutiveOfficeRoomMapping`

None of the above currently writes to any audit table.

## Why Implementation Was Blocked This Sprint

Both call sites above run inside a **tenant** Supabase session (the
acting user is an org manager/admin, never the platform owner). Writing
those events to `owner_audit_logs` would:

1. Be rejected by `WITH CHECK (public.is_owner())` for ~100% of org
   admins — every audit write would silently fail or surface a noisy
   RLS error to the user.
2. Mislabel the actor: `owner_email` is `NOT NULL` and is intended for
   the platform owner's email, not the tenant user's email. Storing a
   tenant manager's email there would corrupt the contract of the
   table and break the owner-panel audit timeline UI
   (`OwnerSecurityPageContent.tsx`, `PlanHistoryTimeline.tsx`).
3. Bypass tenant isolation: a tenant should not be able to read another
   tenant's audit rows. `owner_audit_logs` has no `organization_id`
   column and no per-tenant RLS scoping. Reusing it for tenant data
   would either leak across tenants (if RLS were widened) or remain
   unreadable to the tenant who created the events.

There is no `tenant_audit_logs` table, no generic `audit_events` table,
and no audit-log helper in `src/lib` that targets a tenant-scoped table.
Searches over `src/` and `supabase/migrations/` for `tenant_audit`,
`audit_event`, `audit_action`, and `activity_log` returned no hits.

A safe implementation therefore requires:

- A new `public.tenant_audit_logs` table with `organization_id uuid NOT
  NULL` and tenant-scoped RLS (`current_org_id() = organization_id`,
  manager/admin INSERT, no UPDATE/DELETE policies).
- A composite index on `(organization_id, created_at desc)`.
- An owner-panel SELECT policy (`is_owner()`) so the platform owner can
  read across tenants.
- A small `logTenantAuditEvent()` helper in `src/lib/tenant/` that
  resolves `current_org_id()` and the acting user, then inserts the
  row.

All four items are schema / RLS / migration / new-file changes, which
this sprint's strict rules disallow.

## Safety Notes

- No code change was made; therefore no new attack surface, no secret
  was logged, no PII was added to any persisted store.
- The existing owner-only audit trail continues to function as today
  for owner-initiated actions (plan edits, client password resets,
  user deletes).
- The Sprint 1C delete guards continue to provide a *user-visible*
  signal that a destructive action was blocked, even without a
  persisted audit row.

## How To Test

```bash
npm run lint              # PASS (pre-existing <img> warning only)
npm run build             # PASS
npm run verify:isolation  # PASS (static checks)
```

Confirm nothing was logged from tenant code:

```bash
git grep -nE 'owner_audit_logs' src/lib/org src/lib/tenant
# should print no matches
```

## What Remains For Sprint 2A

This is the migration/RLS sprint the audit logs need. Recommended scope:

1. Migration `tenant_audit_logs` table:
   - `id uuid PK`, `organization_id uuid NOT NULL REFERENCES
     organizations(id) ON DELETE CASCADE`
   - `actor_user_id uuid NULL REFERENCES profiles(id) ON DELETE SET
     NULL`, `actor_email text NULL`
   - `action text NOT NULL`, `target_type text NOT NULL`,
     `target_id uuid NULL`
   - `metadata jsonb NOT NULL DEFAULT '{}'` (no secrets — schema-doc
     the allowed keys)
   - `created_at timestamptz NOT NULL DEFAULT now()`
   - Composite index `(organization_id, created_at desc)` and a
     secondary `(organization_id, action)`.

2. RLS:
   - SELECT: `USING (current_org_id() = organization_id OR is_owner())`
   - INSERT: `WITH CHECK (current_org_id() = organization_id AND
     can_manage_tenant_org())`
   - No UPDATE / no DELETE (immutable).

3. `src/lib/tenant/audit.ts` helper:
   - `logTenantAuditEvent({ action, targetType, targetId, metadata })`
   - Resolves `current_org_id()` via RPC and the actor's email via
     `auth.getUser()`.
   - Best-effort: catch and `console.warn` so an audit insert never
     blocks the primary mutation. Mirrors the owner-side
     `logPlanAction` pattern.

4. Wire-in points (added in the same Sprint 2A after the helper lands):
   - `src/lib/org/structureDb.ts` — every `create/update/delete*` and
     `upsertEmployeeRelation`.
   - `src/lib/tenant/executiveOfficeRoomMappings.ts` —
     `replace/update/deactivate*RoomMapping`.

5. Metadata-key allowlist documented inline:
   - Allowed: ids, names, structure_level, fixed_room_key,
     mapped_unit_type, mapped_unit_id, before/after of these fields.
   - Forbidden: any password/token/email-body, IP, user-agent,
     full employee record, any field not already visible in the app to
     the actor.

6. Owner panel "Tenant audit" tab spec (UI sprint, deferred): read-only
   timeline by org, no edit affordances.

7. CI assertion (extend `verify-tenant-isolation.mjs`): fail if
   `tenant_audit_logs` is missing the `organization_id` column or its
   RLS, or if any new `delete*` export in `structureDb.ts` does not
   call `logTenantAuditEvent`.
