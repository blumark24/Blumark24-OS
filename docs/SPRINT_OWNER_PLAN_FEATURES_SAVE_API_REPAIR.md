# Owner Plan Features — Save Path Repair (Server-Verified API)

Date: 2026-06-27
Scope: replace the browser-direct write to `public.plan_features`
with a server-verified owner API. No UI redesign, no dashboard
changes, no virtual office visual changes, no tenant route gating
bypass, no Auth flow change, no RLS change, no middleware change,
no Supabase migration. Basic/Growth feature defaults unchanged
unless the owner explicitly toggles them through the now-reliable
save path.

## Root Cause

`src/app/owner/_lib/planMutations.ts` previously wrote
`plan_features` directly from the browser through `ownerSupabase`
(anon key + JWT). Two compounding problems made saves unreliable:

1. **RLS WITH CHECK depends on a live owner JWT.**
   `migrations/020_saas_package_departments.sql` gates every write
   to `plan_features` on `WITH CHECK (public.is_owner())`.
   `public.is_owner()` (from `migrations/009_owner_command_center_tables.sql`)
   reads `auth.jwt() ->> 'email'` and checks it against the
   `blumark24@gmail.com` / `blumark.sa@gmail.com` allowlist. When
   the owner's session is stale, expired, missing, or the
   `blumark_owner_auth` localStorage entry has drifted, the JWT
   the browser sends does not satisfy `is_owner()` and the write
   is silently rejected. The previous code did not surface this as
   a user-visible error in many failure modes.

2. **`cleanFeatures` was a single-direction allowlist.**
   With the post-#477 fix, `OWNER_WORKSPACE_FEATURES` now includes
   `virtual_office` and `external_integrations`, so the input
   array is no longer dropped — but the underlying RLS-write
   problem remained.

Net effect: the owner could toggle `المكتب الافتراضي` /
`التكاملات المتقدمة`, see the toggle change in the UI, but the
row never persisted. Reopening the modal showed the old state.

## Why Browser-Side RLS Writes Were Unreliable

- The owner panel runs in the same browser tab as the customer
  workspace. The two surfaces use isolated localStorage keys
  (`blumark_owner_auth` vs `blumark_customer_auth`, see
  `src/lib/supabase/ownerClient.ts`), but session refresh failures
  on one surface can desync the other. `is_owner()` only succeeds
  when the JWT email claim is in the allowlist; any drift
  silently fails the check.
- Even when the session is live, supabase-js v2 occasionally
  refreshes the token mid-request. If the refresh races the
  `plan_features` write, the new token may be valid but the
  response may already be in flight with the old one.
- `is_owner()` is `SECURITY DEFINER` and `STABLE` — it cannot be
  introspected from the client. A failure does not produce a
  helpful diagnostic in the network panel.

All of the above are solved by moving the write server-side: the
JWT is verified once with `admin.auth.getUser(token)`, the email
is checked against the same allowlist via `isOwnerEmail()`, and
the write itself uses the service role — which is not subject to
`is_owner()` RLS at all.

## New API Route

`src/app/api/owner/plans/features/route.ts`

- `runtime = "nodejs"`, `dynamic = "force-dynamic"`, no-store
  response headers.
- `POST` only. No `GET`, `PATCH`, `DELETE`, or `OPTIONS`.
- Pipeline:
  1. `createServiceRoleAdmin()` — refuses to start if
     `SUPABASE_SERVICE_ROLE_KEY` is missing (returns 500 with an
     Arabic message).
  2. `verifyOwnerBearer(req, admin)` — exact same helper every
     other owner API uses (`change-organization-plan`,
     `provision-tenant`, `reset-client-password`, `delete-user`).
     Reads the `Authorization: Bearer …` header, calls
     `admin.auth.getUser(token)`, then `isOwnerEmail(email)` from
     `src/lib/owner.ts`. Returns 401 if header missing, 403 if
     email is not in the allowlist.
  3. Payload validation:
     - `planId` must be a UUID string.
     - `featureKeys` must be `string[]`; each entry is trimmed and
       checked against the hardcoded allowlist of 12 canonical
       `WorkspaceFeature` keys (`dashboard`, `tasks`, `clients`,
       `employees`, `reports`, `org`, `finance`, `strategy`,
       `automation`, `ai`, `virtual_office`,
       `external_integrations`). Anything else is silently
       dropped — defense in depth on top of the client-side
       `OWNER_WORKSPACE_FEATURES` allowlist.
  4. Confirms the plan row exists (`plans.id = planId`). Returns
     404 if not.
  5. Reads existing rows from `plan_features` and diffs against
     the selected set. **Unknown legacy rows are left alone**;
     only allowlisted rows can be deleted by this route. This
     means a future migration that re-introduces a deprecated key
     does not race the owner UI.
  6. Deletes unchecked-and-allowlisted rows, then upserts the
     selected rows with `onConflict: "plan_id,feature_key"`.
  7. Re-reads `plan_features` for the plan and returns the
     authoritative `featureKeys` array. The client refetches via
     `fetchPlanFeatures` after a successful save; this returned
     array exists so the client can detect drift between the
     request and the persisted state.
  8. `writeOwnerAuditLog(admin, { action: "update_plan_features_api", … })`
     — same audit pattern as every other owner mutation route.

### Security Model

- Service role key never crosses the network boundary toward the
  browser. It is read from `SUPABASE_SERVICE_ROLE_KEY` only inside
  the Node.js route handler.
- Two layers of owner verification:
  1. The Bearer token is validated against Supabase Auth.
  2. The resolved email is checked against the platform-owner
     allowlist (`isOwnerEmail`).
- Three layers of feature-key validation:
  1. Client-side `cleanFeatures()` filter (`OWNER_WORKSPACE_FEATURES`).
  2. Server-side `cleanFeatureKeys()` filter
     (`ALLOWED_FEATURE_KEYS` set, defined in the route).
  3. Existing CHECK constraints / unique indexes on
     `plan_features` (untouched).
- No body field other than `planId` (UUID-validated) and
  `featureKeys` (string allowlist) is read. The route refuses
  unknown structure.
- The route never reads or writes any table other than `plans`
  (one read for existence) and `plan_features` (read/delete/
  upsert).
- A non-owner who somehow obtains a tenant Bearer token cannot
  call this route: `verifyOwnerBearer` returns 403.
- The plan_features RLS policies remain in place. The browser
  client (`ownerSupabase`) can still SELECT through RLS
  (`fetchPlanFeatures`), which is unchanged.

## Files Changed

| File | Change |
|---|---|
| `src/app/api/owner/plans/features/route.ts` | new — server-verified POST route described above |
| `src/app/owner/_lib/planMutations.ts` | `updatePlanFeatures()` now grabs the owner session via `ownerSupabase.auth.getSession()`, sends `Authorization: Bearer …` to the new API, and surfaces Arabic errors from the route. `fetchPlanFeatures()` is **unchanged** and still uses `ownerSupabase` (read-only — RLS SELECT through `is_owner()` continues to work). `OWNER_WORKSPACE_FEATURES`, `OWNER_FEATURE_LABELS_AR`, `cleanFeatures()`, `logPlanAction()`, and every other export are untouched. |
| `docs/SPRINT_OWNER_PLAN_FEATURES_SAVE_API_REPAIR.md` | new (this file) |

No edits to:

- `src/app/owner/plans/_components/PlansPageContent.tsx` — the
  modal still imports `OWNER_WORKSPACE_FEATURES` and
  `OWNER_FEATURE_LABELS_AR`. Toggles for `المكتب الافتراضي` /
  `التكاملات المتقدمة` keep rendering automatically.
- `src/lib/supabase/ownerClient.ts` — the owner browser auth
  client is unchanged.
- `src/lib/owner.ts` — the owner email allowlist is the same
  source the new route uses (via `verifyOwnerBearer` →
  `isOwnerEmail`).
- `src/lib/api/ownerServerCommon.ts` — `verifyOwnerBearer`,
  `createServiceRoleAdmin`, and `writeOwnerAuditLog` are reused
  as-is.
- Any RLS policy, migration, middleware, audit-log helper,
  package-gating helper, virtual office logic/visual, dashboard
  page, or other route.
- `WorkspaceFeature` in `src/lib/features/packageFeatures.ts` —
  no schema/type change.

## Verification Steps

### Owner panel

1. Sign in as the platform owner.
2. Open `/owner/plans` → Enterprise → "ميزات الباقة".
3. Toggle `المكتب الافتراضي` and `التكاملات المتقدمة` on. Save.
4. Close the modal. Reopen it. Both toggles must still be on.
5. Toggle `التكاملات المتقدمة` off. Save. Reopen — only
   `المكتب الافتراضي` should remain on.
6. Repeat with Advanced. Confirm Basic/Growth are untouched
   unless the owner explicitly enables them.
7. Try to call the API as a non-owner (e.g. paste a tenant
   user's Bearer token) — must respond `403` with the Arabic
   "غير مصرح" message. No row should change in the DB.
8. Try to call the API with no Bearer header — must respond
   `401` with "جلسة غير صالحة — سجّل الدخول مجدداً".

### Tenant dashboard

1. As an Enterprise tenant user (any non-owner email mapped to
   that org), open `/dashboard`.
2. The sidebar Virtual Office entry should render as a normal
   `<Link href="/virtual-office">` — no `Lock` icon, no
   `متقدم` badge — after the owner has saved the feature on.
3. Hit `/api/tenant/workspace-context` from the browser
   devtools. `enabledFeatures` array must contain
   `"virtual_office"` and `"external_integrations"`.
4. Navigate to `/virtual-office`. The `WorkspaceRouteGuard`
   must allow access. (No change to the guard itself.)

### Server logs

- `[api/owner/plans/features]` is the log tag. Failures print
  the underlying Supabase error message server-side; the
  response carries the Arabic-safe message only.
- `owner_audit_logs` receives a row per successful save with
  `action = "update_plan_features_api"`, the actor email, the
  plan id, and both `feature_keys` (request) and `persisted`
  (DB state) in `metadata`.

## Confirmation — Out-Of-Scope Areas Unchanged

The following were **not** modified by this repair:

- `src/contexts/**`, `middleware.ts`, every `src/app/api/**`
  route other than the new one, every Supabase migration, every
  RLS policy.
- Dashboard page chrome (still the pre-2D restored version).
- Virtual office page, components, scopes, room mappings.
- `WORKSPACE_ROUTES`, `PLAN_FEATURES`, `filterNavRoutes`,
  `canAccessWorkspaceRoute`, `featureEnabled`.
- Tenant audit logs (Sprint 2A) — no wire-in for this route.
  The owner audit log table (`owner_audit_logs`) is reused
  through the existing `writeOwnerAuditLog` helper.
- `useTenantWorkspace`, `useDashboardSummary`, every other hook.
- The Sprint 2C `DashboardLayout` padding-token swap.
- The Sprint 2B premium component library and design tokens.

`npm run lint`, `npm run build`, and `npm run verify:isolation`
all pass.
