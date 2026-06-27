# Owner Plan Features — Virtual Office Repair

Date: 2026-06-27
Scope: parity fix between the canonical TypeScript matrix and the
owner-facing plan-features editor + DB. No UI redesign, no dashboard
redesign, no virtual office visual changes, no org structure logic,
no route gating bypass, no Auth/RLS/middleware changes, no Supabase
query changes beyond the additive repair migration, no mock data.

## Root Cause

Two separate but compounding gaps:

1. **Owner UI feature list was incomplete.**
   `src/app/owner/_lib/planMutations.ts` exports
   `OWNER_WORKSPACE_FEATURES` — the list the plan-features modal
   iterates over (`PlansPageContent.tsx:341`) and the allowlist
   `cleanFeatures()` uses to filter input/output. The Sprint 1B
   premium gate added `virtual_office` and `external_integrations`
   to `WorkspaceFeature` in `src/lib/features/packageFeatures.ts`,
   but `OWNER_WORKSPACE_FEATURES` was not updated. Result:
   - The owner could not see toggles for the two keys.
   - Any save through `updatePlanFeatures()` would never *add* the
     keys, because `cleanFeatures()` dropped them from the
     input array before the upsert.

2. **The A3 sync migration deleted any non-canonical rows.**
   `supabase/migrations/20260619200000_a3_sync_canonical_plan_features.sql`
   shipped before Sprint 1B. Its canonical CTE lists only the 9
   pre-1B features. Its DELETE step removes any `plan_features` row
   for `basic` / `growth` / `advanced` / `enterprise` whose key is
   not in the canonical CTE. After it ran in production:
   - `plan_features` had **no row** for `virtual_office` or
     `external_integrations` on any plan.
   - `/api/tenant/workspace-context` reads `plan_features` rows
     verbatim into `enabledFeatures`, so Enterprise + Advanced
     tenants were blocked from `/virtual-office`.

## Why Enterprise Was Blocked

Runtime access is decided by DB rows in `plan_features`, **not** by
the TypeScript `PLAN_FEATURES` fallback. The fallback only matters
when no DB row exists for the entire plan. A3 left an empty (for
these two keys) but non-empty (for the other features) row set, so
the fallback never engaged. Enterprise tenants whose `plans.slug =
"enterprise"` therefore had `enabledFeatures` containing every other
canonical feature but missing `virtual_office`. The dashboard sidebar
locked-state recovery (commit `8674f64`) correctly surfaced this as
the "متقدم" badge, which is what the customer saw.

## Files Changed

| File | Change |
|---|---|
| `src/app/owner/_lib/planMutations.ts` | added `virtual_office`, `external_integrations` to `OWNER_WORKSPACE_FEATURES`; added Arabic labels `المكتب الافتراضي`, `التكاملات المتقدمة` in `OWNER_FEATURE_LABELS_AR`; added a header comment explaining the parity contract and runtime access model |
| `supabase/migrations/20260627100000_repair_premium_features_for_advanced_enterprise.sql` | new — additive upsert of `virtual_office` and `external_integrations` into `plan_features` for slugs `advanced` and `enterprise`. No deletes. Idempotent. |
| `docs/SPRINT_OWNER_PLAN_FEATURES_VIRTUAL_OFFICE_REPAIR.md` | new (this file) |

No edits to:

- `src/app/owner/plans/_components/PlansPageContent.tsx` — it already
  maps over `OWNER_WORKSPACE_FEATURES` and looks up
  `OWNER_FEATURE_LABELS_AR[feature]`, so the new keys appear
  automatically. No hard-coded list duplicated anywhere.
- `src/lib/features/packageFeatures.ts` — already canonical from
  Sprint 1B; no change needed.
- `src/app/api/tenant/workspace-context/route.ts` — already reads
  `plan_features` rows verbatim; no change needed.
- Any middleware, RLS policy, Auth helper, dashboard page, virtual
  office component, org structure logic, audit-log helper,
  package-gating helper.

## Migration Behavior

The new migration:

- `RAISE NOTICE` (not exception) if `plans` or `plan_features` is
  missing — never crashes a fresh local DB.
- For every `plans` row with `slug IN ('advanced', 'enterprise')`,
  cross-joins with the two premium feature keys and `INSERT`s into
  `plan_features` with
  `ON CONFLICT (plan_id, feature_key) DO NOTHING`.
- **No DELETE.** Existing rows survive.
- **No update** of pricing, names, slugs, sort order, is_active,
  limits, subscriptions, organizations, or any other table.
- **Basic and growth are not touched.** Tenants on those plans do
  not gain Virtual Office unless the owner explicitly grants it
  later through the owner UI (which is now wired correctly).
- Idempotent — safe to re-run.

## How To Verify From The Owner Panel

1. Log in as the platform owner (allowlisted email).
2. Open `/owner/plans`.
3. Select the **Enterprise** plan → "ميزات الباقة".
4. Confirm `المكتب الافتراضي` and `التكاملات المتقدمة` appear in the
   features list. After the migration runs, both should be
   pre-checked. Save and reload — both should still be checked.
5. Repeat with the **Advanced** plan — same expectation.
6. Repeat with **Basic** and **Growth** — both new toggles should
   appear but be **unchecked** by default. Save and reload — they
   should remain unchecked unless the owner explicitly opts in.

## How To Verify From The Tenant Dashboard

1. As an Enterprise (or Advanced) tenant user, sign in.
2. Open `/dashboard`. In the sidebar, the **المكتب الافتراضي** entry
   should appear between `الهيكل الإداري للمنشأة` and
   `خطة النمو` as a normal link (no lock icon, no "متقدم" badge).
3. Click the entry — should navigate to `/virtual-office` without
   the `WorkspaceRouteGuard` blocking access.
4. As a Basic/Growth tenant, repeat. The same entry should still
   appear (recovery sprint) but as the locked-state button with the
   `متقدم` pill and the toast on click — and direct URL access to
   `/virtual-office` should still be blocked by the route guard.
5. Inspect `/api/tenant/workspace-context` response for the
   Enterprise tenant — `enabledFeatures` array must include
   `"virtual_office"` and `"external_integrations"`.

## Confirmation — Out-Of-Scope Areas Unchanged

The following were **not** modified:

- No Auth flow, session helper, owner allowlist, or
  `verifyOwnerBearer` change.
- No RLS policy added, modified, or removed.
- No Supabase query in `useDashboardSummary`, `useTenantWorkspace`,
  or any other hook.
- No dashboard page change, no virtual-office visual or logic
  change, no org structure logic change.
- No middleware change.
- No package-gating helper change (`filterNavRoutes`,
  `canAccessWorkspaceRoute`, `featureEnabled`, `PLAN_FEATURES` —
  all untouched).
- No audit-log wiring.
- No new dependency, no UI redesign, no integration code.

`npm run lint`, `npm run build`, and `npm run verify:isolation` all
pass.
