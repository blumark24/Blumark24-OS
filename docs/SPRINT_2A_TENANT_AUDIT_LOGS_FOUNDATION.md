# Sprint 2A — Tenant Audit Logs Foundation

Date: 2026-06-27
Scope: schema foundation + helper only. No UI, Auth, middleware, package
gating, or unrelated modules touched. `owner_audit_logs` is unchanged.
No mock data. No secrets persisted.

## What Changed

- New migration: `supabase/migrations/20260627000000_2a_tenant_audit_logs_foundation.sql`
- New helper: `src/lib/tenant/tenantAuditLogs.ts`
- New doc: `docs/SPRINT_2A_TENANT_AUDIT_LOGS_FOUNDATION.md` (this file)

No callers were wired up. This sprint is foundation-first per the brief.

## Migration Added

`20260627000000_2a_tenant_audit_logs_foundation.sql` creates
`public.tenant_audit_logs`. Idempotent (`CREATE TABLE IF NOT EXISTS`,
`DROP POLICY IF EXISTS`, `CREATE INDEX IF NOT EXISTS`); safe to re-run.

### Columns

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | `gen_random_uuid()` default |
| `organization_id` | `uuid NOT NULL` | FK → `organizations(id)` `ON DELETE CASCADE` |
| `actor_user_id` | `uuid NULL` | FK → `profiles(id)` `ON DELETE SET NULL` |
| `actor_email` | `text NULL` | Length ≤ 320 |
| `action` | `text NOT NULL` | Length 1–80 |
| `target_type` | `text NOT NULL` | Length 1–80 |
| `target_id` | `uuid NULL` | |
| `metadata` | `jsonb NOT NULL DEFAULT '{}'` | Must be a JSON object |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | |

### Indexes

- `tenant_audit_logs_org_created_at_idx` — `(organization_id, created_at DESC)`
- `tenant_audit_logs_org_action_idx` — `(organization_id, action)`
- `tenant_audit_logs_org_target_idx` — `(organization_id, target_type, target_id)`

### Pre-flight checks

The migration `RAISE EXCEPTION`s if any of these are missing:
`public.organizations`, `public.profiles`, `public.current_org_id()`,
`public.can_manage_tenant_org()`, `public.is_owner()`. These are all
already in place (migrations 009, 011, 019, 024).

## RLS Policy Summary

`ALTER TABLE public.tenant_audit_logs ENABLE ROW LEVEL SECURITY;`

### SELECT

```
USING (
  public.is_owner()
  OR (
    organization_id = public.current_org_id()
    AND public.can_manage_tenant_org()
  )
)
```

- Platform owner sees all rows.
- Tenant readers see only rows for their own `organization_id`, **and**
  only if they are owner / super_admin / organization_manager /
  board_member (the same set that already passes
  `can_manage_tenant_org()`).
- Regular tenant employees cannot read audit rows.

### INSERT

```
WITH CHECK (
  organization_id = public.current_org_id()
  AND public.can_manage_tenant_org()
  AND (actor_user_id IS NULL OR actor_user_id = auth.uid())
)
```

- Caller can only insert rows tagged with their own `current_org_id()`.
- Caller must be a tenant manager/admin/board_member (or owner).
- `actor_user_id` must be either NULL or the caller's own `auth.uid()` —
  prevents impersonation.

### UPDATE / DELETE

No policies defined → all UPDATE and DELETE attempts are rejected by
RLS. Rows are immutable.

### Grants

`GRANT SELECT, INSERT ON public.tenant_audit_logs TO authenticated;`
`REVOKE UPDATE, DELETE ON public.tenant_audit_logs FROM authenticated;`

## Helper Summary

`src/lib/tenant/tenantAuditLogs.ts` exports:

- `logTenantAuditEvent(input)` — `Promise<{ ok, error? }>`
  - Inserts a single row.
  - Best-effort: always returns; never throws to the caller. Failures
    log a `console.warn` and surface in the return value so callers can
    decide whether to display them.
  - Sanitizes metadata before insert.
  - Trims and length-caps `action`, `target_type`, and `actor_email`.
- `sanitizeAuditMetadata(input)` — recursive sanitizer:
  - At the **top level**, keeps only keys in
    `TENANT_AUDIT_METADATA_ALLOWLIST`.
  - At **any depth** (inside `before` / `after` / arrays of objects),
    drops any key matching
    `/password|secret|token|api[_-]?key|authorization|cookie/i`.
  - Recurses into nested objects and arrays up to
    `MAX_METADATA_DEPTH = 3`. Anything deeper is dropped silently
    (primitive scalars at any depth are preserved).
  - Truncates each string to
    `MAX_METADATA_STRING_LENGTH = 500` characters.
  - Drops non-JSON values (functions, symbols, bigints).
- `TENANT_AUDIT_METADATA_ALLOWLIST` — the canonical top-level set:
  `name, before, after, fixed_room_key, mapped_unit_type, mapped_unit_id,
  structure_level, parent_id, department_id, team_id, position_id,
  employee_id, reason, note`.
- `MAX_METADATA_DEPTH`, `MAX_METADATA_STRING_LENGTH` — exported so
  callers and tests can reference the same limits.

The helper takes the Supabase client as an argument so callers control
auth context. There is no module-level Supabase singleton.

## What Is Logged Now

Nothing yet. This sprint deliberately ships the table, RLS, and helper
without wiring any callers. The previous deletion safety in Sprint 1C
still throws plain Arabic errors for blocked deletes; those events are
not persisted yet.

## What Is Not Logged Yet

- Org structure mutations: `createDepartment`, `updateDepartment`,
  `deleteDepartment`, `createTeam`, `updateTeam`, `deleteTeam`,
  `createPosition`, `updatePosition`, `deletePosition`,
  `assignEmployeeToOrgUnit`, `upsertEmployeeRelation`,
  `deleteEmployeeRelation`.
- Virtual office room mapping mutations:
  `replaceExecutiveOfficeRoomMapping`,
  `updateExecutiveOfficeRoomMapping`,
  `deactivateExecutiveOfficeRoomMapping`.
- Sprint 1C blocked-delete events (the throw cases) — no log row
  emitted.
- Cross-organization visibility for tenant readers (RLS forbids this
  by design).

## Safety Notes

- `owner_audit_logs` is untouched.
- RLS denies cross-tenant SELECT; tenant readers see only their own
  `current_org_id()` rows.
- INSERT WITH CHECK forbids impersonation via `actor_user_id`.
- UPDATE / DELETE have no policies → immutable rows.
- Helper sanitizes metadata and rejects keys named after credentials.
- Helper is best-effort and never throws, so a transient log failure
  cannot break an org-structure or virtual-office mutation.
- No new env vars, no new secrets, no new external network calls, no
  new RPCs.
- No changes to `current_org_id()`, `can_manage_tenant_org()`, or
  `is_owner()`.

## How To Test

Static gates:

```bash
npm run lint              # PASS (pre-existing <img> warning only)
npm run build             # PASS
npm run verify:isolation  # PASS
```

Live verification (requires a connected Supabase project — not run in
CI without secrets):

1. Apply the migration:
   ```bash
   supabase migration up 20260627000000
   ```
2. As a tenant manager of Org A, call:
   ```ts
   await logTenantAuditEvent({
     client, organizationId: orgA.id,
     actorUserId: me.id, actorEmail: me.email,
     action: "test.ping",
     targetType: "smoke",
     metadata: { note: "hello" },
   });
   ```
   Expect `{ ok: true }`. Insert visible via
   `SELECT * FROM public.tenant_audit_logs ORDER BY created_at DESC LIMIT 1;`
3. From the same Org A manager, attempt to read Org B's rows:
   ```sql
   SELECT * FROM public.tenant_audit_logs WHERE organization_id = '<org_b>';
   ```
   Expect zero rows (RLS blocks).
4. From a regular tenant employee (not manager), attempt insert and
   select. Expect both to be rejected by RLS.
5. From the platform owner session, select across orgs. Expect rows
   from all tenants visible.
6. Attempt `UPDATE` or `DELETE` from any role. Expect rejection.
7. Call the helper with `metadata: { password: "x", note: "ok" }`.
   Expect the stored `metadata` to be `{ "note": "ok" }` (password key
   stripped by `sanitizeAuditMetadata`).
   Then call with a nested payload such as
   `metadata: { before: { name: "A", token: "abc" }, after: { name: "B" } }`.
   Expect the stored value to be
   `{ before: { name: "A" }, after: { name: "B" } }` — the nested
   `token` is removed by the recursive sanitizer. Strings longer than
   `MAX_METADATA_STRING_LENGTH` are truncated, and objects nested
   deeper than `MAX_METADATA_DEPTH` are dropped.
8. Call the helper with `actorUserId` set to another user's UUID.
   Expect the INSERT to be rejected by RLS WITH CHECK.

## What Remains For Sprint 2B

Sprint 2B is the wire-in sprint. With the schema and helper soaked, the
next sprint can:

1. Wire `logTenantAuditEvent` into each mutation in
   `src/lib/org/structureDb.ts` (create/update/delete for department,
   team, position, plus `assignEmployeeToOrgUnit` and
   `deleteEmployeeRelation`). Use the existing supabase client, resolve
   the actor via `auth.getUser()`, pass only allowlisted metadata
   (names + before/after summaries).
2. Wire `logTenantAuditEvent` into
   `src/lib/tenant/executiveOfficeRoomMappings.ts` for replace, update,
   and deactivate. Include `fixed_room_key`,
   `mapped_unit_type`, and `mapped_unit_id` in metadata.
3. Log Sprint 1C blocked-delete events as a separate `action` (e.g.
   `org.department.delete_blocked`) so the audit trail captures
   attempts, not just successes.
4. Add a read endpoint (server-side) so the owner panel and tenant
   manager can list rows with cursor pagination. Keep RLS as the
   source of truth — do not bypass.
5. Spec a tenant UI "Activity / Audit" panel — read-only, no edit
   affordances. Defer the UI to its own sprint.
6. Extend `scripts/verify-tenant-isolation.mjs` to assert
   `tenant_audit_logs` exists with the expected columns, RLS enabled,
   and no UPDATE / DELETE policies.
7. Add a CI assertion that any new `delete*` / `update*` export in
   `structureDb.ts` calls `logTenantAuditEvent`.
