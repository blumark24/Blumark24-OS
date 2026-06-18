# Stage 3B — Supabase Advisors Performance Cleanup

Date: 2026-06-18
Branch: `p0/supabase-advisors-stage-3b`

## Purpose

This stage prepares a small, reviewable Supabase performance-advisor cleanup migration.

It does **not** apply changes to production by itself.

## Scope

Included:

- Add FK covering index for `public.executive_office_room_mappings.created_by`.
- Add FK covering index for `public.executive_office_room_mappings.updated_by`.
- Drop one duplicate departments structure-level index, keeping the org-scoped index name.

Excluded:

- No UI changes.
- No API changes.
- No RLS disabled.
- No data deletion.
- No production SQL execution from this PR.
- No removal of unused indexes yet.
- No RLS policy consolidation yet.

## Why this is safe

### FK indexes

The added indexes are standard single-column indexes on existing FK columns. They improve query planning and referential-action checks without changing returned data or authorization rules.

### Duplicate index cleanup

The migration drops only `public.idx_departments_structure_level` if present, while keeping `public.idx_departments_org_structure_level`.

The org-scoped name is preferred because tenant queries are organization-oriented.

## Deferred work

The following Supabase Advisor groups are intentionally deferred to Stage 3C because they can affect authorization or require larger regression testing:

- `auth_rls_initplan`
- `multiple_permissive_policies`
- `authenticated_security_definer_function_executable`

The following is deferred until real usage patterns stabilize:

- `unused_index`

## Validation checklist before merge

Run locally after pulling this branch:

```powershell
git diff --check
npm.cmd run lint
npm.cmd run build
npm.cmd run verify:isolation
```

## Manual DBA checklist before applying SQL

Before applying the migration to production Supabase:

1. Confirm `executive_office_room_mappings` exists.
2. Confirm `created_by` and `updated_by` exist.
3. Confirm both duplicate department indexes exist or accept the no-op if the generic index is already absent.
4. Apply migration during a low-traffic window.
5. Re-run Supabase Performance Advisor after apply.
