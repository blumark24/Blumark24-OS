# Supabase P0 — Stage 1: Auth/Profile Schema Drift

## Status

Stage 1 is a small, safe production-hardening pass after PR #504.

## Scope

This stage fixes only a runtime schema drift issue in the customer Auth context:

- Production `public.profiles` has `avatar`.
- Production `public.profiles` does not have `avatar_url`.
- Production `public.profiles` does not have `force_password_change`.
- The previous client code queried `avatar_url, force_password_change`, creating repeated `400` Supabase API responses and Postgres log errors.

## Fix

`src/contexts/AuthContext.tsx` now reads only schema-confirmed profile columns:

- `id`
- `name`
- `role`
- `email`
- `avatar`
- `department`
- `is_active`
- `organization_id`

`forcePasswordChange` remains part of the TypeScript app contract, but is set to `false` until a reviewed schema migration adds a real column.

## Safety

- No database migration.
- No RLS change.
- No Auth redesign.
- No production data mutation.
- No UI redesign.
- No owner/customer session logic change.
- No service-role usage.

## Remaining Supabase P0 items

These remain intentionally deferred to a separate reviewed stage:

1. Enable leaked password protection in Supabase Auth settings.
2. Review SECURITY DEFINER functions exposed to `authenticated`:
   - `public.can_manage_tenant_org()`
   - `public.current_org_id()`
   - `public.get_my_role()`
   - `public.is_owner()`
3. Decide whether each should:
   - revoke direct `EXECUTE` from `authenticated`, `anon`, and `public`, or
   - switch to `SECURITY INVOKER`, or
   - remain exposed with explicit documentation and tests.
4. Review RLS initplan warnings and multiple permissive policies.
5. Add indexes for unindexed virtual office foreign keys if query paths require them.

## Validation target

Run before merge:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run verify:isolation
```

## Launch impact

This stage reduces noisy production profile/Auth errors and improves operational clarity, but it does not complete full Supabase P0 security hardening.
