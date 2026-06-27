# Sprint 2D — Dashboard Desktop + Mobile Redesign

Date: 2026-06-27
Scope: redesign of `src/app/dashboard/page.tsx` only. No business
logic, Supabase queries, Auth, RLS, middleware, migrations, package
gating, virtual office logic/visuals, org structure logic, audit
wiring, mock data, or integrations were changed. RTL Arabic remains
the primary layout direction.

## What Was Inspected

- Current dashboard at `src/app/dashboard/page.tsx` (932 lines pre-2D).
- All data hooks the page consumes — none required changes.
- Existing chrome (`workspaceVisual`, `workspaceUi`,
  `PremiumMetricCard`, `JellyfishBackground`) was kept untouched in
  the repo and is still imported by other pages.

## Dashboard Data Sources Preserved

Every hook call from the previous file remains, with **identical
signatures and identical destructured fields**:

| Hook | Used for |
|---|---|
| `useAuth()` | user identity, loading shell |
| `usePermissions()` + `mapAuthRoleToUserRole` | role label, `isSuperAdmin` |
| `useDashboardSummary()` | KPI, projects, activities, finance trend, employees-by-department, clients buckets, tasks buckets |
| `useProfileOrgDepartment()` | department display |
| `useTenantCompanyName()` | company name + logo + fallback flag |
| `useMyWorkContext()` | work identity chips |
| `useTenantWorkspace()` | `planSlug`, `organizationStatus` |
| `getTenantRoleLabel(...)` | Arabic role label |
| `PLAN_LABELS_AR[planSlug]` | Arabic plan name |
| `formatCurrency`, `timeAgo` (utils) | display formatting |

All derived values from the previous file are preserved verbatim:
`kpi`, `taskDistribution`, `aiInsight`, `smartInsights`,
`operationalStatus`/`operationalTone`, `teamPerformance`,
`satisfactionPct`, and the four `dashboardBoards` drilldown
descriptors.

No Supabase query, RPC, or context provider was touched.

## Exact Files Changed

| File | Change |
|---|---|
| `src/app/dashboard/page.tsx` | full visual rewrite — all hooks, drilldown state, and derived values preserved; chrome migrated to Sprint 2B premium primitives |
| `docs/SPRINT_2D_DASHBOARD_DESKTOP_MOBILE_REDESIGN.md` | new (this file) |

Bundle impact (after build): `/dashboard` went from `12.8 kB` →
`11.1 kB` — the chrome simplification slightly reduced page weight.

## Components Used

From `src/components/ui/premium/` (Sprint 2B):

- `GlassCard` — variants `default`, `ai`, `revenue`, `success`,
  `warning`, `critical` (used across hero, sections, modals)
- `MetricCard` — for the four KPI tiles
- `StatusPill` — variants `active`, `warning`, `critical`,
  `neutral`, `premium` (chips, trends, badges)
- `SectionHeader` — title + description + actions for every section
- `PremiumButton` — for the disabled "طلب رابط الدفع" affordance
- `EmptyState` — for empty projects, activities, employees data
- `AIOrbVisual` — replaces the previous Bot icon avatar; pure CSS

A small page-local helper `QuickActionLink` mirrors Sprint 2B's
`QuickActionButton` visual but renders as a `next/link` so the
existing quick-action hrefs keep working without changing route
behavior.

Existing project utilities still used:
- `DashboardLayout` (Sprint 2C-adopted shell)
- `recharts` (chart rendering — unchanged)
- `KPICardSkeleton`, `ChartSkeleton`, `CardSkeleton` (Skeleton.tsx)

Existing chrome removed from this page only (other pages unaffected):
- `JellyfishBackground` — replaced with the deeper premium navy
  surface (per design direction "no excessive glow / no cartoon").
- `workspaceVisual` token map (`WS_CARD`, `WS_SURFACE`, etc.)
- `workspaceUi` components (`StatPill`, `QuickActionTile`,
  `WorkspaceEmptyInline`) — equivalents from Sprint 2B used instead.
- `PremiumMetricCard` — replaced by Sprint 2B `MetricCard`.

## Desktop Behavior

- Hero is a two-column glass section at `premium-laptop` and up:
  identity column on the start (visual right in RTL), AI insight
  panel on the end (visual left in RTL).
- KPI grid is `grid-cols-4` from `premium-laptop`. Each card is a
  `<button>` wrapping a `MetricCard`, opening the same drilldown
  modal as before. Focus ring uses Cyber Cyan with a navy offset.
- Analytics row: revenue chart spans 2 of 3 columns, task
  distribution sits on the side.
- Employees / satisfaction / quick summary row is a 3-up grid.
- Projects table spans 2 of 3 columns, recent activities sit on
  the side.
- Quick actions render as a 6-column grid.
- Subscription card lays the labels in a 3-up grid with the plan
  pill + payment button on the side.

## Mobile Behavior

The mobile layout is **redesigned for mobile, not a squeezed desktop**:

- Hero stacks vertically — identity block first, then the AI
  insight card as a full-width card (much more prominent than the
  previous mobile collapse, where the AI panel was hidden entirely).
- Live status chips wrap freely (`flex-wrap`) instead of clipping.
- KPI grid is `grid-cols-2` on mobile (large touch targets).
- Smart insights collapse to a single column; the AI orb sits at
  the top of the section on mobile (`order-first` is the default;
  desktop reorders it to the side with `premium-tablet:order-last`).
- Analytics, employees, projects, activities rows collapse to a
  single column on mobile to avoid sideways scroll.
- Quick actions are `grid-cols-2` on mobile, expanding to 3 then 6.
- The drilldown modal opens full-width on mobile with safe-area
  padding (`pb-[max(1rem,env(safe-area-inset-bottom))]`) and a
  82dvh max height — same behavior as before, refactored chrome.
- `overflow-x-hidden` and `max-w-full` on the page container guard
  against any accidental horizontal overflow.
- `MobileBottomNav` is unchanged; the shell still applies
  `MOBILE_BOTTOM_NAV_INSET` from Sprint 2C.

## RTL Notes

- `<div dir="rtl">` set on every premium component plus the page
  container.
- Numeric blocks (`tabular-nums`) and currency values use
  `dir="ltr"` locally so the `formatCurrency(...) SAR` segment
  aligns naturally without disturbing the surrounding RTL.
- The hero's two columns use `premium-laptop:flex-row` (default
  row direction in an RTL parent puts the first child on the
  start = visual right, matching the previous layout).
- Smart insights section uses `premium-tablet:order-last` on the
  AI orb so the orb visually moves to the start (right) on
  tablet+ — matches the previous order without hard-coding LTR.
- No `text-left` / `text-right` outside numeric/currency blocks.

## What Was Intentionally Not Redesigned

- All other pages under `src/app/**` — tasks, clients, employees,
  org, virtual-office, ai, automation, finance, reports, strategy,
  profile, settings, admin-recovery, owner panel.
- All shell components — `DashboardLayout` (only the Sprint 2C
  padding-token swap remains), `Sidebar`, `Header`,
  `MobileBottomNav`, `MobileShellContext`, `QuickActionsMenu`,
  `WorkspaceRouteGuard`.
- Every data hook, context provider, Supabase query, RPC, or API
  route.
- Auth, RLS, middleware, package gating, audit-log wiring, virtual
  office logic and visuals, org structure logic.
- The drilldown modal *behavior* (state, board descriptors, open/
  close, focus management). Only its inner chrome was migrated to
  premium primitives.
- `globals.css`, `tailwind.config.ts`, all other components — no
  edits.

## How To Test

```bash
npm run lint              # PASS (pre-existing <img> warning only)
npm run build             # PASS — /dashboard 11.1 kB (was 12.8 kB)
npm run verify:isolation  # PASS
```

Manual:

1. Sign in as a tenant manager. Confirm the dashboard loads with
   the new chrome and **identical numbers** to the previous build
   (same hooks, same derivations).
2. Resize 360 → 1920 px. Confirm:
   - KPI grid stays 2 cols on mobile, 4 on laptop+.
   - Hero AI insight becomes a full card on mobile and a side panel
     on laptop+.
   - No horizontal scrollbar at any width.
3. Click each KPI card → the drilldown modal opens with the same
   `detailRows` / `detailList` content as before.
4. As a non-`super_admin`, confirm `activeEmployeeNames` are not
   rendered (existing permission check preserved).
5. Confirm the AI assistant link still routes to `/ai`.

## Patch — Blumark Ambient Background

The landing background
(`src/components/landing/CodexAnimatedBackground.tsx`) uses a canvas
particle system (55–80 particles + per-frame connection lines), a
global `mousemove` listener, and a `click` listener that hijacks
`#contact` links to open WhatsApp. That is too heavy and behaviorally
coupled for a tenant workspace, so it was **not reused**.

Instead a CSS-only ambient layer was added:
`src/components/dashboard/BlumarkAmbientBackground.tsx`.

### Exact Files Changed (patch)

| File | Change |
|---|---|
| `src/components/dashboard/BlumarkAmbientBackground.tsx` | new — pure-CSS ambient layer |
| `src/app/dashboard/page.tsx` | import + mount inside the outer dashboard container as the first child; container gained `relative` (no other layout change) |
| `docs/SPRINT_2D_DASHBOARD_DESKTOP_MOBILE_REDESIGN.md` | this patch section |

### What It Does

- Sits behind dashboard cards via `pointer-events: none`,
  `absolute inset-0`, and `-z-10`.
- Renders four subtle layers:
  1. Soft base wash (radial gradients top + bottom).
  2. Top-right Cyber Cyan orb, slow drift (`animate-float-slow`).
  3. Bottom-left Electric Blue orb, mid drift (`animate-float-mid`).
  4. Center AI Violet glow, gentle pulse (`animate-pulse-glow`) —
     tablet+ only.
- Adds a faint dotted grid (CSS radial-gradient at 5% opacity) —
  tablet+ only.
- All decorative; `aria-hidden`.

### Performance Notes

- Zero JS at runtime. No canvas, WebGL, video, or animation library.
- Pure CSS animations on `transform`/`opacity` (GPU-friendly).
- Bundle impact on `/dashboard`: **11.1 kB → 11.5 kB** (+0.4 kB),
  almost entirely Tailwind class strings. No new dependencies.
- Reuses existing Tailwind keyframes already defined in
  `tailwind.config.ts` (`floatSlow`, `floatMid`, `pulseGlow`) — no
  new tokens, no new CSS file.
- `backdrop-filter: blur(...)` on GlassCards composes with the layer
  underneath; cards remain crisp because the layer is itself blurred
  (`blur-3xl`) so high-frequency detail never reaches the card.

### Reduced-Motion Behavior

Every animated layer uses `motion-reduce:animate-none`. When the
user's OS reports `prefers-reduced-motion: reduce`, all orbs hold
their starting position. The gradients themselves are not animated,
so the visual identity remains intact without motion.

### Mobile Behavior

- Orbs shrink (420/460 → 260/280 px) and lower opacity (0.18/0.16
  → 0.12/0.10) on `premium-mobile`.
- The AI Violet glow is **hidden** on mobile (`premium-tablet:block`)
  to reduce paint cost and avoid contrast loss on small screens.
- The dotted grid is **hidden** on mobile so it doesn't compete with
  text density on small viewports.
- Outer container still has `overflow-x-hidden`, so no horizontal
  scroll is introduced.

### Readability Safeguards

- Maximum orb opacity is 0.18 — well below any UI contrast threshold.
- Cards retain their `backdrop-blur-xl` and tinted backgrounds, so
  text contrast against the card surface is unaffected by what sits
  behind.
- Tabular numbers (`tabular-nums`) and `text-[#F8FAFC]` body text
  contrast were verified at WCAG AA against the darkest orb tints.
- The ambient layer is `pointer-events-none` and `aria-hidden`, so
  screen readers and keyboard users see no change.

## What Remains For Sprint 2E

1. Mobile-only welcome / status card pinned just under the hero
   for at-a-glance ops status (deferred — requires a new
   `useNotifications`-driven data path).
2. Migrate Tasks page onto Sprint 2B primitives — same approach,
   same data preservation.
3. Migrate Clients CRM next; the existing list/grid pattern there
   is a good fit for `PremiumTableShell` + `StatusPill`.
4. Spec a tenant "Activity" panel that consumes the upcoming
   `tenant_audit_logs` table (Sprint 2A) once Sprint 2B's UI
   primitives are adopted on a few pages.
5. Add visual regression coverage for `/dashboard` once an
   internal preview/sandbox route exists.
6. Consider a `DashboardKpiGrid` extraction into
   `src/components/dashboard/` if Tasks/Clients pages need similar
   drilldown-on-card behavior — defer until a second consumer exists.
7. Deprecation plan for `JellyfishBackground` and
   `PremiumMetricCard` once all consumers move to Sprint 2B
   primitives.
