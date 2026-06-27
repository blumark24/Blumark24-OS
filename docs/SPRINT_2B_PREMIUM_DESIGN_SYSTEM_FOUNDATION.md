# Sprint 2B — Premium Design System Foundation

Date: 2026-06-27
Scope: foundation only. No business logic, Auth, RLS, middleware,
Supabase migrations, package gating, integrations, mock data, virtual
office logic, or virtual office visual design were touched. RTL Arabic
remains the primary layout direction. No existing page was redesigned.

## What Changed

Net-new files only, plus an additive extension of the Tailwind theme.

- `src/lib/design/tokens.ts` — canonical premium palette, spacing,
  radii, breakpoints, and component-class maps (glass card, premium
  button, status pill).
- `src/components/ui/premium/` — opt-in component library:
  - `AppShell.tsx` — layout primitive with header / optional aside /
    main / footer slots. No routing, no nav state.
  - `GlassCard.tsx` — six variants (`default`, `critical`, `success`,
    `warning`, `ai`, `revenue`).
  - `MetricCard.tsx` — label/value/hint with optional trend pill.
  - `StatusPill.tsx` — five variants (`active`, `warning`, `critical`,
    `neutral`, `premium`).
  - `SectionHeader.tsx` — title + description + actions, RTL-aware.
  - `QuickActionButton.tsx` — icon + label + hint tile.
  - `EmptyState.tsx`, `LoadingState.tsx`, `ErrorState.tsx` — feedback
    surfaces with consistent visuals.
  - `PremiumButton.tsx` — five variants (`primary`, `secondary`,
    `ghost`, `danger`, `premium`) and three sizes (`sm`/`md`/`lg`).
  - `PremiumInput.tsx` — labelled input with `numericLtr` toggle for
    currency / phone / IDs.
  - `PremiumTableShell.tsx` — table chrome only (caption/header rows/
    body/footer). No data binding.
  - `ResponsiveGrid.tsx` — column counts per `mobile`/`tablet`/`laptop`/
    `desktop` breakpoint.
  - `DeviceVisibilityHelper.tsx` — show/hide per premium breakpoint
    without conditional mounting.
  - `AIOrbVisual.tsx` — purely decorative gradient orb. No canvas, no
    audio, no video, no event handlers.
  - `index.ts` — barrel export.
- `tailwind.config.ts` — additive extension:
  - New `colors.premium.*` namespace.
  - New `screens.premium-{mobile,tablet,laptop,desktop,wide}`.
  - New `spacing.premium-{1,2,3,4,5,6,8,10}` tokens (4–40px).
  - New `borderRadius.premium-{md,lg,xl,2xl}` (12/16/24/32 px).
  - Existing `brand.*` colors, `borderRadius["2xl"]`, animations,
    keyframes, gradients, fonts, and shadows are unchanged.
- `docs/SPRINT_2B_PREMIUM_DESIGN_SYSTEM_FOUNDATION.md` (this file).

## Exact Files Changed

| File | Change |
|---|---|
| `src/lib/design/tokens.ts` | new |
| `src/components/ui/premium/AppShell.tsx` | new |
| `src/components/ui/premium/GlassCard.tsx` | new |
| `src/components/ui/premium/MetricCard.tsx` | new |
| `src/components/ui/premium/StatusPill.tsx` | new |
| `src/components/ui/premium/SectionHeader.tsx` | new |
| `src/components/ui/premium/QuickActionButton.tsx` | new |
| `src/components/ui/premium/EmptyState.tsx` | new |
| `src/components/ui/premium/LoadingState.tsx` | new |
| `src/components/ui/premium/ErrorState.tsx` | new |
| `src/components/ui/premium/PremiumButton.tsx` | new |
| `src/components/ui/premium/PremiumInput.tsx` | new |
| `src/components/ui/premium/PremiumTableShell.tsx` | new |
| `src/components/ui/premium/ResponsiveGrid.tsx` | new |
| `src/components/ui/premium/DeviceVisibilityHelper.tsx` | new |
| `src/components/ui/premium/AIOrbVisual.tsx` | new |
| `src/components/ui/premium/index.ts` | new (barrel) |
| `tailwind.config.ts` | additive: `colors.premium`, `screens.premium-*`, `spacing.premium-*`, `borderRadius.premium-*` |
| `docs/SPRINT_2B_PREMIUM_DESIGN_SYSTEM_FOUNDATION.md` | new |

No existing page, component, context, API route, migration, helper, or
middleware was edited.

## Design Tokens Added

### Palette (`PREMIUM_COLORS`)

| Token | Hex |
|---|---|
| `navyDeep` | `#020817` |
| `navyMidnight` | `#071426` |
| `navyRoyal` | `#0B1F3A` |
| `blueElectric` | `#147CFF` |
| `cyanCyber` | `#00D9FF` |
| `blueIce` | `#7DDCFF` |
| `violetAi` | `#7C3AED` |
| `emerald` | `#10B981` |
| `amber` | `#F59E0B` |
| `red` | `#EF4444` |
| `textMuted` | `#94A3B8` |
| `textPrimary` | `#F8FAFC` |

Tailwind class equivalents live under `colors.premium.*` (e.g.
`bg-premium-navy-royal`, `text-premium-text-primary`).

### Spacing (`PREMIUM_SPACING`)

`xs2 → 4`, `xs → 8`, `sm → 12`, `md → 16`, `lg → 20`, `xl → 24`,
`xl2 → 32`, `xl3 → 40` (px). Tailwind classes:
`p-premium-{1..10}`, `gap-premium-{1..10}`, etc.

### Radius (`PREMIUM_RADIUS`)

`md → 12`, `lg → 16`, `xl → 24`, `xl2 → 32`, `full → 9999` (px).
Tailwind: `rounded-premium-md`, `rounded-premium-lg`,
`rounded-premium-xl`, `rounded-premium-2xl`.

### Component class maps

- `GLASS_CARD_CLASSES` — keyed by `GlassCardVariant`.
- `PREMIUM_BUTTON_CLASSES` — keyed by `PremiumButtonVariant`.
- `STATUS_PILL_CLASSES` — keyed by `StatusPillVariant`.

Components compose these with `cn()` so callers can layer layout
classes without overriding the variant tint.

## Components Added

- **Layout:** `AppShell`, `ResponsiveGrid`, `DeviceVisibilityHelper`.
- **Cards:** `GlassCard`, `MetricCard`.
- **Feedback:** `EmptyState`, `LoadingState`, `ErrorState`.
- **Inputs / Actions:** `PremiumButton`, `PremiumInput`,
  `QuickActionButton`.
- **Text:** `SectionHeader`, `StatusPill`.
- **Tables:** `PremiumTableShell` (chrome only, zero data binding).
- **Decorative:** `AIOrbVisual` (pure CSS, no canvas/audio/video).

All components:

- Set `dir="rtl"` explicitly so they remain RTL even if dropped into an
  LTR sub-tree.
- Are stateless. No `useEffect`, no data fetching, no Supabase access.
- Forward `ref` where it makes sense (interactive primitives).

## Responsive Rules

Tailwind `screens` extended with:

| Breakpoint | min-width |
|---|---|
| `premium-mobile` | 360px |
| `premium-tablet` | 768px |
| `premium-laptop` | 1280px |
| `premium-desktop` | 1440px |
| `premium-wide` | 1920px |

Default Tailwind breakpoints (`sm`/`md`/`lg`/`xl`/`2xl`) remain.
Existing classes throughout the codebase still work; new components opt
in to the `premium-*` set so the responsive contract is explicit.

`ResponsiveGrid` exposes `cols.mobile|tablet|laptop|desktop` props that
map to the premium breakpoints; defaults are `1/2/3/4`.

## RTL Rules

- Body already sets `direction: rtl` (see `src/app/globals.css`).
  Premium components re-assert `dir="rtl"` so they remain RTL inside
  any LTR-leaking parent.
- Numbers/currency/IDs render with `tabular-nums` and stay
  visually right-aligned. `PremiumInput.numericLtr` flips just the
  `<input>` direction to `ltr` while keeping the label/hint in RTL.
- `MetricCard` value renders with `dir="ltr"` for the numeric block so
  large numbers and signs align consistently; the surrounding card
  stays RTL.
- `AppShell` places the sidebar slot using
  `flex-row-reverse` at `premium-laptop` so the aside sits on the RTL
  start (visual right).
- No `text-left` / `text-right` is hard-coded outside numeric blocks;
  RTL flow handles alignment.

## What Was Intentionally Not Redesigned Yet

- All pages under `src/app/**` (dashboard, tasks, clients, employees,
  org, virtual-office, ai, owner, finance, reports, strategy,
  profile, settings, marketing pages).
- All existing components under `src/components/{layout,landing,demo,
  brand,employees,jellyfish,org,settings,ui}` — including
  `PremiumKpiCard.tsx`, `PremiumMetricCard.tsx`, `PremiumRolePicker.tsx`,
  `workspaceUi.tsx`, `workspaceVisual.ts`. None were touched.
- `globals.css` glass-card / btn-primary / btn-secondary / sidebar
  styles — left as-is for legacy components.
- Virtual office visuals — explicitly out of scope.
- Auth, RLS, middleware, API routes, package gating — out of scope.
- AppSidebar — deferred; the existing layout owns nav state, so adding
  a parallel sidebar would risk drift. `AppShell.side` is the slot
  that will host it when the migration sprint runs.

## How To Test

Static gates:

```bash
npm run lint              # PASS (pre-existing <img> warning only)
npm run build             # PASS
npm run verify:isolation  # PASS
```

Visual smoke (no UI page added this sprint):

1. From any existing page that already runs in dev, import a
   component from the barrel:
   ```tsx
   import { GlassCard, MetricCard, PremiumButton } from "@/components/ui/premium";
   ```
   Drop it into a non-production sandbox; confirm Tailwind picks up
   the `premium-*` classes (the `content` glob already covers
   `./src/components/**/*.tsx`).
2. Resize the viewport across 360px → 1920px. Verify `MetricCard`
   numbers stay right-aligned, `SectionHeader` switches actions to
   the start at `premium-tablet`, and `ResponsiveGrid` reflows to
   1/2/3/4 columns.
3. Inspect any `PremiumInput numericLtr` — label/hint should remain
   RTL while the input text aligns LTR.

## What Remains For Sprint 2C

This sprint deliberately did not migrate any page. Sprint 2C is the
first adoption sprint. Recommended scope, one surface at a time so
review stays small:

1. Adopt `AppShell` + `SectionHeader` + `ResponsiveGrid` on the
   Dashboard page, keeping all existing data hooks and route guards
   intact (replace layout chrome only).
2. Replace dashboard KPI cards with `MetricCard` + `StatusPill`,
   preserving `useDashboardSummary` and KPI math.
3. Spec the AppSidebar contract (nav order from
   `TENANT_NAV_ORDER`, permission/feature gates from
   `canAccessWorkspaceRoute`) so the sidebar can sit in
   `AppShell.side`.
4. Migrate Tasks and Clients next — both already have flat
   `page.tsx` files, low blast radius.
5. Add an internal-only `/_design` preview route ONLY if a dev/preview
   route pattern is introduced project-wide; otherwise document the
   barrel imports here.
6. Add CI assertion: any new file under `src/components/**` that
   imports from `@/lib/design/tokens` must also set `dir="rtl"`.
7. Add visual-regression coverage (e.g. Playwright + a `/design`
   sandbox) — out of scope until the dev-preview pattern lands.
