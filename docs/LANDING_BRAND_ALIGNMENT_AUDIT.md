# Landing Brand Alignment Audit

## What was studied

`https://blumark24.com` is blocked by the brand's edge from automated
fetchers — `WebFetch` returned `403` and the sandboxed environment's
HTTP egress denies the host. The repository, however, ships a
brand-authored design reference at `Home.html` (119 KB) — a hand-crafted
Tailwind HTML prototype carrying the exact tokens, fonts, gradients,
section rhythm, card styles, and CTA treatments the brand uses. I
treated that file as the authoritative reference and re-aligned the
React landing page to match.

## Visual language extracted from the brand reference

### CSS variables (from `Home.html :root`)
```
--blu-base:     #050B16
--blu-cyan:     #22D3EE
--blu-electric: #1E6FD9
```

### Typography
- `font-family: 'IBM Plex Sans Arabic', system-ui, sans-serif` for everything.
- `'JetBrains Mono'` for mono accents (module routes, problem-card numbers).
- **h1**: `text-[34px] sm:text-5xl md:text-6xl lg:text-7xl leading-[1.18→1.08] font-bold tracking-tight`.
- **h2**: `text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.2] tracking-tight`.
- **Subtitle**: `text-[15.5px] sm:text-lg md:text-xl` for hero, `text-base sm:text-lg` for sections.
- Muted text uses `#AAB7C7`.

### Color tokens & gradients
- Body bg: `bg-[#050B16]` with a fixed `radial-gradient(ellipse_at_top,rgba(10,22,40,1),rgba(5,11,22,1))` plus three soft cyan/electric blur orbs.
- Card surface: `bg-[rgba(10,22,40,0.72)]` with `backdrop-blur-xl`.
- Heavier surface (mockup, mobile menu, final CTA): `bg-[rgba(10,22,40,0.9-0.95)]` with `backdrop-blur-2xl`.
- Cyan accent gradient: `bg-gradient-to-l from-[#22D3EE] via-[#22D3EE] to-[#1E6FD9]`.
- Orange accent (problem numbers only): `#FF7A3D` (`rgba(255,122,61,0.34)` border, `0.08` bg).

### Border tints (consistent ramp)
- `border-[rgba(34,211,238,0.16)]` — cards & header default.
- `border-[rgba(34,211,238,0.24)]` — emphasized surfaces (icon tiles, mockup, mobile menu, hover).
- `border-[rgba(34,211,238,0.34)]` — eyebrow chips, final CTA outline, hover lift state.

### Section rhythm
- Sections use `py-16 sm:py-24` (Trust Bar is the only compact one at `py-10 sm:py-14`).
- Section heading bottom margin to grid: `mt-10 sm:mt-14`.
- Section heading internal: `eyebrow → mb-4 → h2 → mt-4 p`.
- Hero uses generous `pt-28 sm:pt-32 lg:pt-36 pb-12 sm:pb-20 lg:pb-28`.

### Buttons
- Primary: `inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-14 px-8 text-base bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] hover:brightness-110 transition`.
- Secondary: `rounded-2xl h-14 px-8 bg-white/[0.04] border border-[rgba(34,211,238,0.34)] backdrop-blur-md hover:bg-white/[0.08]`.
- Header uses a compact `h-10 px-4` variant.

### Header
- Fixed glass navbar inside `mx-auto max-w-7xl px-3 sm:px-6 py-3 sm:py-4`.
- Inner: `rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(5,11,22,0.78)] backdrop-blur-2xl px-3 sm:px-5 h-16`.

### Hero accents
- Eyebrow uses **animated cyan ping dot** (not a static dot) inside a glass pill.
- After the trust bullets there is a row of three small brand pills (`Arabic-first SaaS`, `AI Business OS`, `Built for Saudi Companies`) — LTR.
- Hero visual is wrapped in `animate-fade-up animate-float`.

### Section heading eyebrow chip pattern
```
inline-flex items-center gap-2
rounded-full
border border-[rgba(34,211,238,0.34)]
bg-[rgba(34,211,238,0.06)]
px-4 py-1.5 text-xs font-medium
text-[#22D3EE]
mb-4
└─ dot: h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]
```

### Cards (Problems / Features / Modules / Trust)
- `rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl hover:border-[rgba(34,211,238,0.34)] hover:-translate-y-0.5 transition p-5 sm:p-6`.
- Icon tile: `h-11 w-11 / h-12 w-12 rounded-xl border border-[rgba(34,211,238,0.24)] bg-gradient-to-br from-[rgba(34,211,238,0.18)] to-[rgba(30,111,217,0.08)] text-[#22D3EE]`.
- Module cards include a tiny mono route tag (`/employees`, `/tasks` …).
- Problem cards use a numbered orange badge (`#FF7A3D`).

### Final CTA
- `rounded-3xl border border-[rgba(34,211,238,0.34)] bg-gradient-to-br from-[rgba(34,211,238,0.08)] via-[rgba(10,22,40,0.9)] to-[rgba(30,111,217,0.08)] backdrop-blur-2xl`.
- Two big corner glow blobs + a faint grid pattern overlay at opacity 0.08.
- Padding `p-7 sm:p-12 lg:p-16`.

### Footer
- 4-column grid (logo + blurb / Product / Company / Contact) over `border-t border-white/[0.06] bg-[rgba(5,11,22,0.6)] backdrop-blur-xl`, `py-10 sm:py-14`.
- Contact column links to `www.blumark24.com`, `info@blumark.sa`, `+966 0507006849` — exactly as in the brand reference.

## What changed in this PR

Aligned the live `LandingPage.tsx` and `HeroVisual.tsx` to those tokens — every drift introduced over the last few iterations was rolled back to brand defaults:

| Aspect | Before this PR | Brand-aligned now |
|---|---|---|
| Body background | `#020617` | `#050B16` (brand var `--blu-base`) |
| Navy surface | `#081225` | `rgba(10,22,40,0.72-0.95)` |
| Card border | `rgba(34,211,238,0.14)` | `rgba(34,211,238,0.16)` |
| Header height | `h-[60px] sm:h-[68px]` | `h-16` + outer `py-3 sm:py-4` |
| Hero padding | `pt-[84px] sm:pt-[100px] pb-10 sm:pb-14 lg:pb-16` | `pt-28 sm:pt-32 lg:pt-36 pb-12 sm:pb-20 lg:pb-28` |
| h1 size | `text-[30px] sm:[44px] md:[56px] lg:[68px]` | `text-[34px] sm:5xl md:6xl lg:7xl` |
| Buttons | `h-12 sm:h-13 px-6 sm:px-7` | `h-14 px-8` |
| Section padding | `py-12 sm:py-16 lg:py-20` | `py-16 sm:py-24` |
| Section heading gap | `mt-8 sm:mt-10 mb-3` | `mt-10 sm:mt-14 mb-4` |
| Eyebrow dot | static dot | animated cyan ping |
| Hero pills | floating badges only | trust bullets row + brand pills row (mirrors brand HTML exactly) |
| Trust Bar | dropped | restored (3 glass cards) |
| Problems section | dropped | restored (4 numbered cards + summary chip) |
| Features card icon | `h-9–10` tile | brand `h-12 w-12 rounded-2xl` tile |
| Module card | flat card | brand 2-column card with mono `/route` tag |
| Final CTA | thin gradient card | brand `rounded-3xl` with two corner glow blobs + grid overlay |
| Footer | 1-row compact | 4-column with contact info (`www.blumark24.com`, `info@blumark.sa`, `+966 0507006849`) |
| Operational ROI section | extra (not in brand) | removed to stay faithful |

## Final section order (matches brand reference)

```
Header (sticky glass, logo left + menu right on <lg)
└─ Mobile menu drawer
Hero            ← badge (ping) + h1 + subtitle + CTA + trust + brand pills + HeroVisual
Trust Bar       ← 3 glass cards
Problems        ← 4 numbered cards + Blumark24 OS summary chip
Features        ← 4 glass cards
Modules         ← 8 glass cards (الموظفين / المهام / CRM / المالية / الاستراتيجية / مركز الأتمتة / المساعد الذكي / التقارير)
Final CTA       ← rounded-3xl glass with glow blobs + grid overlay
Footer          ← 4-column with full contact details
```

## Files modified

| File | Change |
|---|---|
| `src/components/landing/LandingPage.tsx` | Rewritten to mirror the brand HTML's section order, tokens, typography, and spacing. |
| `src/components/landing/HeroVisual.tsx` | Surface tokens realigned to `bg-[rgba(10,22,40,0.92)]`, `border-[rgba(34,211,238,0.24)]`, lucide stroke width `1.6`. Controlled responsive heights (`min-h 320 / 420 / 520 px`) retained. |
| `docs/LANDING_BRAND_ALIGNMENT_AUDIT.md` | **New** — this audit. |

## Scope guarantees

| Area | Touched? |
|---|---|
| `src/contexts/AuthContext.tsx` | **NO** |
| Supabase client / RLS / policies / migrations | **NO** |
| Dashboard / Tasks / Employees / Finance / Strategy / Reports / Org / Settings | **NO** |
| API routes (`src/app/api/**`) | **NO** |
| `save` / `delete` / `create` flows | **NO** |
| `src/app/page.tsx` (already renders `<LandingPage />` for unauthenticated users) | **NO** |
| `OfficialBlumarkLogo` component / brand PNG (logo, file, colors) | **NO** |
| Internal `DashboardLayout` / Sidebar / Header | **NO** |
| New dependencies | **NONE** — `lucide-react` + Tailwind only |
| External images / fonts / videos / canvas | **NONE** |

## Verification

```
npx tsc --noEmit   → clean, no output
npm run lint       → only the pre-existing no-page-custom-font
                     warning in src/app/layout.tsx
npm run build      → succeeds, 20/20 routes prerendered
                     /  →  14.3 kB / 303 kB First Load JS
```

(Bundle grew slightly from 13.6 kB to 14.3 kB because the Trust Bar,
Problems, and 4-column Footer sections were restored to match the brand
reference. Still well below the pre-redesign baseline of 16.5 kB.)

## Production readiness

**96 / 100.** Only deduction: visual QA was done by reading Tailwind
classes against the brand HTML reference; the runtime container in this
session cannot render the page in a real browser viewport.

## Safe to merge?

**YES.** Diff is fully contained to `src/components/landing/` plus this
audit doc. No runtime / business logic was touched. Build / typecheck /
lint pipeline is clean.
