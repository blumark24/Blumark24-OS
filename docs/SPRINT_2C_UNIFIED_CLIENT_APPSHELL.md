# Sprint 2C — Unified Client AppShell

Date: 2026-06-27
Scope: client app-shell foundation. No page redesign, no business
logic, no Supabase queries, no Auth/RLS/middleware/migration/
package-gating, no virtual office logic or visuals, no mock data, no
integrations. RTL Arabic remains the primary layout direction.

## What Was Inspected

| Question | Finding |
|---|---|
| Is there a shared client wrapper? | **Yes.** `src/components/layout/DashboardLayout.tsx` is the single client AppShell. |
| Which pages adopt it? | 14 client pages: `dashboard`, `tasks`, `clients`, `employees`, `org`, `virtual-office`, `ai`, `automation`, `finance`, `reports`, `strategy`, `profile`, `settings`, `admin-recovery`. |
| Does the owner panel use the same shell? | **No.** `src/app/owner/layout.tsx` is intentionally self-contained (`OwnerSidebar` + `OwnerHeader` + `OwnerGuard`). Out of scope for this sprint. |
| Mobile bottom nav exists? | **Yes.** `src/components/layout/MobileBottomNav.tsx` is already wired through `DashboardLayout` with `MOBILE_BOTTOM_NAV_INSET` to prevent content from sitting under it. |
| Sidebar position in RTL? | **Right.** `body { direction: rtl }` (from `globals.css`) plus a `flex` container with Sidebar first → Sidebar renders on the visual right, main content on the visual left. |
| Mobile shell context? | **Yes.** `MobileShellContext` is mounted inside the shell and drives the mobile sidebar overlay. |
| Page padding today? | `px-3 py-3 sm:px-4 sm:py-4 lg:p-6` = 12 / 16 / 24 px progression. |
| Page-wide background today? | Inline `style={{ background: "#0a1628" }}` (legacy brand darkest navy). |
| Workspace route guard? | `WorkspaceRouteGuard` wraps `{children}` defensively so a page that forgets `PageGuard` still cannot leak. |

## Current Layout Structure

```
RootLayout (src/app/layout.tsx)
└── <html dir="rtl" lang="ar"> + global providers
    └── (per-route) DashboardLayout (src/components/layout/DashboardLayout.tsx)
        ├── Sidebar  (right, RTL flex)
        └── flex-1 column
            ├── Header        (sticky top, mobile menu trigger)
            ├── profile-error / dev banner
            ├── MobileShellContext
            ├── <main> children (page content) — wrapped in WorkspaceRouteGuard
            └── MobileBottomNav (mobile only)
```

The shell already satisfies every structural requirement of this
sprint: RTL right sidebar, top header, main content, mobile-safe
bottom nav, mobile sidebar overlay, premium-direction navy
background, consistent page padding.

## Exact Files Changed

| File | Change |
|---|---|
| `src/components/layout/DashboardLayout.tsx` | one-line edit: `<main>` padding swapped to Sprint 2B premium spacing tokens. **Visually identical** (12 / 16 / 24 px before and after). |
| `docs/SPRINT_2C_UNIFIED_CLIENT_APPSHELL.md` | new (this file). |

### The Edit

```diff
- className={`flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-4 sm:py-4 lg:p-6 ${MOBILE_BOTTOM_NAV_INSET}`}
+ className={`flex-1 overflow-y-auto overflow-x-hidden px-premium-3 py-premium-3 sm:px-premium-4 sm:py-premium-4 lg:p-premium-6 ${MOBILE_BOTTOM_NAV_INSET}`}
```

`premium-3 = 12px`, `premium-4 = 16px`, `premium-6 = 24px` (defined in
`tailwind.config.ts` from Sprint 2B). Existing `sm:` and `lg:`
breakpoints are unchanged — Tailwind defaults still apply. The
content reflow is zero pixels.

## Whether A Shared Wrapper Was Found

**Found.** No new shell file was created. `DashboardLayout` is
treated as the canonical client AppShell, and Sprint 2B's `AppShell`
from `src/components/ui/premium/` remains available as the future
greenfield primitive for pages that opt into a full redesign later.
Creating a parallel adapter today would risk drift with the existing
Sidebar / Header / MobileShellContext / MobileBottomNav state and was
intentionally avoided.

## AppShell Changes

- Adopted Sprint 2B premium spacing tokens on the main content
  region. All other class names, structure, providers, and components
  inside `DashboardLayout` are unchanged.
- Did not touch `Sidebar.tsx`, `Header.tsx`, `MobileBottomNav.tsx`,
  `MobileShellContext.tsx`, `QuickActionsMenu.tsx`,
  `WorkspaceRouteGuard.tsx`, or any context provider.
- Did not change the page background color, the dev/profile banners,
  or any conditional rendering.

## Mobile / Desktop Behavior

| Behavior | Before | After |
|---|---|---|
| Sidebar position (RTL) | right | right |
| Mobile sidebar overlay | trigger via header menu | trigger via header menu |
| Bottom nav inset on mobile | `MOBILE_BOTTOM_NAV_INSET` applied | `MOBILE_BOTTOM_NAV_INSET` applied |
| Main content padding (mobile) | `px-3 py-3` = 12px | `px-premium-3 py-premium-3` = 12px |
| Main content padding (≥ `sm`) | `sm:px-4 sm:py-4` = 16px | `sm:px-premium-4 sm:py-premium-4` = 16px |
| Main content padding (≥ `lg`) | `lg:p-6` = 24px | `lg:p-premium-6` = 24px |
| Horizontal overflow guard | `overflow-x-hidden` | `overflow-x-hidden` |
| Page background | `#0a1628` (inline) | `#0a1628` (inline, unchanged) |

No regression to any of the 14 client pages.

## RTL Notes

- `<html dir="rtl" lang="ar">` set in `RootLayout` — unchanged.
- `body { direction: rtl }` in `globals.css` — unchanged.
- DashboardLayout's outer container is `flex`; the Sidebar element is
  declared first in JSX. In RTL, that puts the sidebar visually on
  the right and main content on the left, which is the desired
  Arabic-first arrangement.
- Sprint 2B `premium-*` spacing utilities are direction-agnostic
  (`px-*` = horizontal padding both sides), so adopting them did not
  introduce any LTR-leaning class.

## What Was Intentionally Not Redesigned

- `Sidebar.tsx`, `Header.tsx`, `MobileBottomNav.tsx`,
  `MobileShellContext.tsx`, `QuickActionsMenu.tsx`,
  `WorkspaceRouteGuard.tsx`.
- All 14 client pages — content, hooks, KPIs, charts, virtual office
  visuals, org structure logic, all left untouched.
- The owner panel (`src/app/owner/**`) and its `OwnerSidebar` /
  `OwnerHeader` / `OwnerGuard` / `OwnerLayout`.
- Page background color (still `#0a1628`). A switch to premium
  `#020817` would shift every dashboard surface's contrast and is
  reserved for Sprint 2D after a visual review.
- Tailwind classes inside Sidebar/Header/MobileBottomNav — they
  continue to consume `brand.*` legacy colors.
- `globals.css` glass / btn / sidebar utilities — left as-is for
  pre-existing components.
- Auth, RLS, middleware, API routes, package gating, Supabase
  migrations, audit logging wire-in.

## What Remains For Sprint 2D

1. Adopt premium tokens inside `Sidebar.tsx` and `Header.tsx` (color
   variables only, no layout change) so the shell visual identity
   moves from `brand.*` to `premium.*` without touching nav state.
2. Spec the migration of `body` / shell background from `#0a1628` to
   `#020817`. Side-by-side screenshots required before the switch
   because every glass card consumes that contrast.
3. Migrate one client page (suggest: Dashboard) onto Sprint 2B
   primitives (`SectionHeader`, `MetricCard`, `ResponsiveGrid`)
   while preserving every existing data hook (`useDashboardSummary`,
   permissions, KPIs).
4. Decide between two AppShell tracks:
   - (a) Keep `DashboardLayout` as the canonical shell and continue
     swapping internals to premium tokens.
   - (b) Introduce a `PremiumClientAppShell` adapter that wraps the
     Sprint 2B `AppShell` and the existing client Sidebar/Header.
   The doc-only spec for the chosen track should land before any
   page is migrated.
5. Add CI assertion: any new file under `src/components/layout/**`
   that uses `px-*` / `py-*` / `gap-*` must use a `premium-*` token
   when the value exists in the scale.
6. Visual regression scaffolding (Playwright + a `/_design`
   sandbox) — first dependency before bigger UI work.
