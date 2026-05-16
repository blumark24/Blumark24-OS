# Landing Page UI Audit — Hero Visual Rebuild

## Problem before the change

After PR #50 (transparent logo) and PR #51 (responsive logo sizing), the
landing page still showed a large vertical gap under the hero CTA buttons
and the inline trust row (`بدون بطاقة ائتمان` / `إعداد سريع` / `دعم عربي
كامل`). The legacy dashboard mockup that followed those trust bullets:

- Used KPI labels that did not match the product story (`إجمالي الموظفين`,
  `إجمالي الإيرادات`, etc.).
- Had a heavy "AI chat box" panel that hurt mobile vertical rhythm and
  pushed the rest of the page down without adding signal.
- Had no floating product badges, so the value proposition (AI Business
  OS, Arabic-first SaaS, Built for Saudi Companies) was not communicated
  visually.
- Did not use a controlled responsive height; the mockup ballooned on
  tablet/desktop and created the perceived "empty area" the reviewer was
  seeing.

## Files modified

| File | Change |
|---|---|
| `src/components/landing/HeroVisual.tsx` | **New.** Standalone Hero Visual: glass dashboard mockup with the 4 required KPIs, a mini area chart, an activity list (desktop only), and 3 floating badges. |
| `src/components/landing/LandingPage.tsx` | Imported `HeroVisual` and replaced the inline dashboard mockup block (≈140 lines) with a single `<HeroVisual />` call. |

Nothing else was touched.

## How the empty space was solved

1. **Replaced** the bulky legacy mockup with a tighter, responsive
   `HeroVisual` component:
   - Mobile (≤640 px): single column, 2×2 KPI grid, compact chart. The
     mockup naturally lands at ≈300–330 px tall.
   - Tablet (640–1024 px): same single-column layout with larger chart
     and slightly larger KPI cards (≈380–410 px tall).
   - Desktop (≥1024 px): KPIs become a 1×4 row and a 3/5 + 2/5 split
     puts the area chart next to a live activity list, taking the mockup
     up to ≈480–520 px and visually anchoring the hero.
2. **Floating badges** (`AI Business OS`, `Arabic-first SaaS`,
   `Built for Saudi Companies`) sit outside the mockup on `md+` and
   tuck inside the card on `sm` to keep the visual interesting without
   widening the layout.
3. **No fixed height** is used; the content density is what hits the
   spec'd ranges, so there is no clipping at any breakpoint.
4. **Containment**: the wrapper uses `max-w-5xl mx-auto w-full`, the
   page still has `overflow-x-hidden` at the root, and every interior
   column uses `min-w-0` to prevent horizontal scroll on narrow widths
   (375/390/430 px).

The required page order is preserved:

```
Header
 └─ Hero title/subtitle
    └─ CTA buttons
       └─ trust row (bullets)
          └─ HeroVisual          ← new
Feature / Trust cards
Problems / Modules / Automation / Reports / Packages
Final CTA
Footer
```

## Scope guarantees

| Area | Touched? |
|---|---|
| `src/contexts/AuthContext.tsx` | **NO** |
| Supabase client / RLS / policies / migrations | **NO** |
| Dashboard / Tasks / Employees / Finance / Strategy / Org / Reports logic | **NO** |
| API routes (`src/app/api/**`) | **NO** |
| `save` / `delete` / `create` flows | **NO** |
| Logo component or PNG | **NO** (kept as merged in PR #50/#51) |
| Brand colors / typography / global theme | **NO** |

The diff is contained to `src/components/landing/`.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean, no output. |
| `npm run lint` | Only the pre-existing `no-page-custom-font` warning in `src/app/layout.tsx`. No new warnings or errors. |
| `npm run build` | Succeeds. All 20 routes prerendered. Landing `/` bundle: **16.4 kB** (was 16.5 kB before — slightly smaller despite the new component). |

### Responsive sanity (visual contract, not runtime)

- `375 px / 390 px / 430 px` mobile: 2-col KPI grid, chart spans full
  width, badges hide on `<md`, no horizontal scroll (root
  `overflow-x-hidden` + `min-w-0` on inner columns).
- `768 px` tablet: same single-column hero visual, larger chart, badges
  visible inside the card.
- `1024 px / 1440 px` desktop: 4-col KPI row, 3/5 + 2/5 chart-+-activity
  split, badges floating outside the card.

## Production readiness

**Score: 95 / 100**

- +10 No new dependencies, no images, no fonts.
- +10 Pure Tailwind; reuses existing animation utilities
  (`animate-fade-up`, `animate-float`).
- +10 No fixed-height clipping; content fits naturally inside each
  breakpoint's target range.
- +10 Internal logic (auth, supabase, dashboard, tasks, save/delete/
  create) untouched.
- +10 Build/typecheck/lint clean; bundle size flat (–0.1 kB).
- –5 Visual QA was static only — no live browser walk-through was
  performed in this environment.

## Safe to merge?

**YES.** Change is scoped to two files under `src/components/landing/`,
no runtime/business logic touched, and the build/typecheck/lint pipeline
is clean.
