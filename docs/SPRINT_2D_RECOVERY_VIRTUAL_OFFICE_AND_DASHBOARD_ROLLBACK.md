# Sprint 2D Recovery — Virtual Office Visibility + Dashboard Rollback

Date: 2026-06-27
Scope: emergency recovery. No business logic, Supabase queries, Auth,
RLS, middleware, Supabase migrations, package gating rules, virtual
office data logic, org structure logic, audit wiring, mock data, or
integrations were changed. RTL Arabic preserved.

## Why The Recovery Was Needed

The user rejected the Sprint 2D dashboard visual direction and
reported that Virtual Office was missing from the sidebar for the
current tenant package. Two issues had to be addressed without
expanding the rejected visual direction to other surfaces:

1. **Virtual Office hidden** — Sidebar filtered the `virtual_office`
   route entirely when the tenant's plan did not include the
   `virtual_office` feature flag, so the customer could not see that
   the capability exists at all.
2. **Dashboard chrome rejected** — The Sprint 2D rewrite of
   `src/app/dashboard/page.tsx` and the Blumark Ambient Background
   mounted there were not approved for production.

## Why Virtual Office Was Hidden

`src/components/layout/Sidebar.tsx` rendered `navRoutes` from
`useTenantWorkspace()`. `navRoutes` is the **already-filtered**
result of `filterNavRoutes(ctx, hasPermission)` in
`src/lib/features/packageFeatures.ts`, which drops any route whose
`feature` is not in the tenant's `enabledFeatures`. Sprint 1B set
`WORKSPACE_ROUTES.virtual_office.feature = "virtual_office"` and only
added that flag to `advanced` / `enterprise` defaults — so `basic` /
`growth` tenants saw the route silently disappear.

That is correct *access* behavior but wrong *discoverability*
behavior: the customer should know the capability exists and be able
to learn it requires an upgrade.

## Exact Files Changed

| File | Change |
|---|---|
| `src/components/layout/Sidebar.tsx` | adds locked-state visibility for `virtual_office`; injects the entry between `org` and the next item; renders a button (not a link) for locked items; clicking surfaces a toast |
| `src/app/dashboard/page.tsx` | restored to the pre-Sprint-2D state via `git checkout origin/main -- src/app/dashboard/page.tsx` (932 lines, original imports including `JellyfishBackground`, `workspaceVisual`, `workspaceUi`, `PremiumMetricCard`) |
| `docs/SPRINT_2D_RECOVERY_VIRTUAL_OFFICE_AND_DASHBOARD_ROLLBACK.md` | new (this file) |

The Sprint 2B premium component library
(`src/components/ui/premium/**`), the design tokens
(`src/lib/design/tokens.ts`), and the Tailwind premium namespace
remain in the repo untouched — they were a separate foundation that
the rejected dashboard rewrite happened to consume.

`src/components/dashboard/BlumarkAmbientBackground.tsx` is **not
deleted**. It is now an **unused, undocumented-for-adoption**
component left in the tree so its file path remains stable while the
product team evaluates the visual direction. No page imports it.

## How Virtual Office Now Appears

`Sidebar.tsx` computes whether the tenant package includes
`virtual_office` from the already-resolved `navRoutes`:

```ts
const enabledRouteIds = new Set(visibleRoutes.map((r) => r.id));
const showLockedVirtualOffice =
  !_wsNavLoading && !!virtualOfficeRoute && !enabledRouteIds.has("virtual_office");
```

When the entry is enabled:

- Renders as the existing `<Link href="/virtual-office">` with the
  same active-state styling, same `ArrowLeft` chevron, same
  permission/feature gating that `canAccessWorkspaceRoute` already
  enforces upstream.

When the entry is **locked** (basic / growth):

- Renders as a `<button type="button">` (never a `<Link>`) so it
  never navigates and `pathname` cannot mark it active.
- Shows the same icon (`Building2`) at the same vertical position.
- Replaces the chevron with two badges:
  - `متقدم` pill (violet, matches Sprint 2B premium tint at the
    sidebar density)
  - `Lock` icon
- `title` attribute reads "متاح في باقة متقدم أو مؤسسي" for
  collapsed sidebar and tooltips.
- `onClick` calls `toast.info("المكتب الافتراضي متاح في باقة متقدم
  أو مؤسسي")` and closes the mobile sidebar.
- No state, no fetch, no Supabase access, no leakage of
  `virtual_office` data.

The entry is injected immediately after `org` in the nav order, which
matches the documented `TENANT_NAV_ORDER`
(`الهيكل الإداري للمنشأة` → `المكتب الافتراضي` → `خطة النمو`).
If `org` is not visible for the package, the locked entry falls back
to immediately before `settings`. If a future package gates *both*
`org` and `settings` out, it appends at the end — guaranteed visible.

### Safety

- `WORKSPACE_ROUTES`, `PLAN_FEATURES`, and
  `canAccessWorkspaceRoute` are unchanged.
- `useTenantWorkspace().navRoutes` is unchanged.
- The middleware matcher for `/virtual-office` still gates on the
  customer session cookie.
- A `basic` / `growth` user who manually types `/virtual-office` in
  the address bar still hits the same `WorkspaceRouteGuard` and is
  blocked exactly as before — the sidebar locked entry never
  navigates anywhere.

## What Dashboard Visual Changes Were Rolled Back

The following Sprint 2D additions to `src/app/dashboard/page.tsx`
were removed by restoring the file to `origin/main`:

- Premium chrome rewrite that consumed
  `src/components/ui/premium/*` (`GlassCard`, `MetricCard`,
  `StatusPill`, `SectionHeader`, `PremiumButton`, `EmptyState`,
  `AIOrbVisual`) on the dashboard surface.
- Removal of `JellyfishBackground` — restored.
- Removal of `workspaceVisual` / `workspaceUi` /
  `PremiumMetricCard` usage — restored.
- Page-local `QuickActionLink` helper — gone with the rewrite.
- Mounting of `BlumarkAmbientBackground` — gone (the component file
  remains in the tree but is no longer imported by any page).
- All section-by-section visual refactor (hero, KPI grid, smart
  insights, analytics, employees row, projects + activities, quick
  actions, subscription).

Preserved (the rollback does not touch them):

- Every data hook: `useAuth`, `usePermissions`,
  `useDashboardSummary`, `useProfileOrgDepartment`,
  `useTenantCompanyName`, `useMyWorkContext`, `useTenantWorkspace`.
- Every derived value: `kpi`, `taskDistribution`, `aiInsight`,
  `smartInsights`, `operationalStatus`, `teamPerformance`,
  `satisfactionPct`.
- `activeBoard` drilldown state and the four `dashboardBoards`
  descriptors.
- `BOARD_THEME` modal chrome.
- Skeleton components, recharts wiring, profile-error banner,
  isSuperAdmin gating of employee names.
- The Sprint 2C `DashboardLayout` padding-token swap (separate file,
  unaffected by this rollback).

## Confirmation — Out-of-Scope Areas Unchanged

The following were **not** modified by this recovery:

- Supabase schema, migrations, RLS policies.
- `src/app/api/**` API routes.
- `middleware.ts`.
- `src/contexts/**` providers.
- `src/lib/features/packageFeatures.ts` (`PLAN_FEATURES`,
  `WorkspaceFeature`, `canAccessWorkspaceRoute`,
  `filterNavRoutes`).
- Auth flow, session helpers, owner allowlist.
- Virtual office data layer (`src/lib/tenant/aiContext.ts`,
  `executiveOfficeRoomMappings.ts`, `officeScope*` files).
- Org structure logic (`src/lib/org/**`, `structureDb.ts` Sprint 1C
  delete guards).
- Tenant audit logs (Sprint 2A migration + helper).
- All other pages and components.

`npm run lint`, `npm run build`, and `npm run verify:isolation` all
pass. Dashboard bundle returns to the pre-2D size (12.8 kB).

## What Must Happen Before Any New Dashboard Redesign

**No redesign should be merged without visual preview approval.**

Concretely, before opening any future dashboard / page redesign PR:

1. The redesign must be hosted on a preview deployment or an
   internal `/preview/<route>` page that does not affect the
   production tenant experience.
2. Side-by-side screenshots (desktop + mobile, mobile = 360px and
   430px, desktop = 1280px and 1920px) of every redesigned surface
   must be attached to the PR.
3. The product owner must explicitly approve the visual direction
   in the PR description before the diff is merged.
4. Any change to the dashboard must keep all data hooks, derived
   values, drilldown state, and `dashboardBoards` descriptors
   verbatim — no Supabase query, RPC, or context change is
   permitted in a "visual" sprint.
5. A rollback path must be documented in the PR description
   (commit SHA to revert to, files affected, expected build size).
6. The Sprint 2B premium component library and tokens remain
   available, but adopting them on the dashboard is **not** approved
   until the preview-approval rule above is met.
