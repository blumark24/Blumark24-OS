# Blumark24 Mobile Dashboard — Reference Preview

A pixel-close, **preview-only** reconstruction of the approved Blumark24
mobile dashboard reference. Built so the team can review the visual
direction in the running app *before* any production dashboard,
business logic, or data wiring is touched.

> This is a visual mockup. It does not connect to Supabase, does not
> reuse production hooks, does not gate on packages, and does not
> appear in the sidebar or any user-facing navigation.

---

## 1. Reference used

- File: `public/references/blumark-mobile-dashboard-reference.png`
- Origin: design reference attached to the design-approval conversation
  for the Blumark24 mobile dashboard.

If the binary is missing locally, see `public/references/README.md` for
instructions on how to drop the approved PNG into place.

The reference shows a 9:41 iPhone-style mobile dashboard with:

- Deep navy animated background
- Blumark logo centered at top
- User avatar on top right
- Notification icon on top left
- Welcome card with package badge (الباقة الاحترافية)
- Compact 2×2 KPI grid (العملاء / المهام / الإيرادات / الموظفون)
- Quick-actions strip (مهمة جديدة / تقرير سريع / فاتورة جديدة / إضافة عميل)
- Revenue chart card with month picker and call-out
- AI assistant card with glowing globe
- Two side-by-side bottom cards: نشاط حديث and مهام اليوم
- Fixed bottom navigation with a large glowing center plus button

---

## 2. Files created (preview only)

```
public/references/
  README.md                                       # placeholder + instructions

src/app/design-preview/blumark-mobile/
  page.tsx                                        # the preview route
  preview.css                                     # scoped CSS, scoped animations

src/components/design-preview/blumark-mobile/
  MobilePhoneFrame.tsx                            # desktop phone-frame wrapper
  AnimatedBackground.tsx                          # deep-navy glow background
  MobileTopBar.tsx                                # bell / brand / avatar
  PackageWelcomeCard.tsx                          # welcome + package badge
  KpiGrid.tsx                                     # 2×2 KPI cards
  QuickActionsStrip.tsx                           # 4 quick actions
  RevenueChartCard.tsx                            # SVG line/area chart
  AiAssistantCard.tsx                             # globe + AI message
  ActivityCard.tsx                                # نشاط حديث
  TasksTodayCard.tsx                              # مهام اليوم with circle progress
  BottomNav.tsx                                   # bottom nav + center plus

docs/
  BLUMARK24_MOBILE_DASHBOARD_REFERENCE_PREVIEW.md # this document
```

No production file under `src/app/dashboard/**`, `src/components/dashboard/**`,
`middleware.ts`, `supabase/**`, or any context/provider was modified.

---

## 3. How to view

Run the app and open:

```
/design-preview/blumark-mobile
```

- The route is not linked from the sidebar, the dashboard, or any nav.
- It is not protected by middleware (the matcher in `middleware.ts`
  intentionally does not include `/design-preview`).
- AuthContext does not redirect it because `/design-preview` is not part
  of `CUSTOMER_WORKSPACE_ROUTE_PREFIXES`.
- `metadata.robots` is set to `{ index: false, follow: false }`.

On desktop the preview is rendered inside a 412 px phone-frame mockup
centered on a dark canvas. On a real phone (390–430 px) the inner
content fills naturally without horizontal overflow.

---

## 4. Visual system

| Element                  | Token / value                                                 |
| ------------------------ | ------------------------------------------------------------- |
| Deep navy background     | `#020817` + cyan/violet radial orbs                            |
| Glass card surface       | `linear-gradient(135deg, rgba(11,31,58,.80), rgba(7,20,38,.80))` |
| Card border              | `1px solid rgba(125, 220, 255, 0.18–0.22)`                     |
| Glow accent (cyan)       | `rgba(0, 217, 255, 0.10–0.45)`                                 |
| Electric blue accent     | `#147CFF`                                                      |
| Cyber cyan accent        | `#00D9FF` / `#7DDCFF`                                          |
| Success                  | `#10B981`                                                      |
| Warning amber            | `#F59E0B`                                                      |
| Error / urgent           | `#EF4444`                                                      |
| Orange (tiny accents)    | `#ff7a3d` (used sparingly, only as an accent)                  |
| Muted text               | `#94A3B8`                                                      |
| Primary text             | `#F8FAFC`                                                      |
| Font                     | `'IBM Plex Sans Arabic', 'Tajawal', sans-serif`                |
| Card radius              | `16px` (`rounded-2xl`)                                         |
| Layout direction         | RTL (Arabic-first)                                             |
| Mobile target width      | 390 px – 430 px                                                |

Animation: three soft floating orbs and one pulse on the violet glow.
All gated by `prefers-reduced-motion: reduce`.

Charts: inline SVG only. No `recharts`, no client-only JS chart library,
no external HTTP for assets.

Icons: `lucide-react` only.

---

## 5. What is preview-only

Everything under `src/app/design-preview/blumark-mobile/` and
`src/components/design-preview/blumark-mobile/` is **visual** and uses
**static sample data**. Specifically:

- No Supabase imports
- No production hooks (`useAuth`, `useTenantWorkspace`, etc.) used
- No Real RBAC or package gating
- No real user avatar (CSS placeholder only — no external image URLs)
- No real KPIs (sample numbers from the approved reference)
- No real activity / task data
- No mutations, no API calls, no `fetch`
- Sample numbers and labels mirror the values shown in the reference

The preview can be deleted in a single commit by removing the two
folders above plus this doc and the `public/references` README.

---

## 6. What must be approved before production implementation

Before any of this design is moved into the real dashboard:

1. **Numerical sources.** Each KPI in the reference must be mapped to
   a verified Supabase view / RPC bound to the active tenant
   (`organization_id`). Empty states must be honest — never invented.
2. **Package gating.** Each card and quick-action must be wired to the
   real package-aware permission gate so it stays hidden / disabled
   for tenants that do not own the feature.
3. **RBAC.** Each card must respect role/permission scopes — the
   reference shows an executive view; non-executives must see the
   correct subset.
4. **AI assistant.** The "مساعد بلومارك الذكي" surface must call the
   approved tenant-scoped AI brain endpoint with auditable inputs —
   no fake insights.
5. **Charts.** Replace the inline preview SVG with the production
   charting layer used elsewhere in the dashboard, bound to the same
   tenant-aware data source.
6. **Bottom navigation.** The center plus button and bottom nav must
   route to real, RBAC-aware screens. Hidden items must collapse
   gracefully — no dead targets.
7. **PDPL / privacy.** Avatar handling, notification badge counts, and
   activity feed sources must pass the PDPL review before going live.
8. **Performance budget.** The dashboard renders inside the 1000-client
   tenant load profile; the production version must measure under the
   agreed paint / hydration budget for low-end Android.

---

## 7. Matching checklist

A reviewer comparing the rendered preview side-by-side with the
reference image should confirm:

- [ ] Deep navy background with soft cyan + blue glows is visible
      behind every card
- [ ] Blumark logo + `24h` badge sits centered in the top bar
- [ ] Notifications bell (with badge `3`) is on the left in RTL
- [ ] Avatar sits on the right in RTL with an online dot
- [ ] Welcome line says `مرحباً أحمد 👋` with the assistant strapline
- [ ] Package badge reads `الباقة الاحترافية` / `تنتهي في 2025/06/21`
- [ ] KPI grid is a compact 2×2 — exact labels:
      `العملاء`, `المهام`, `الإيرادات`, `الموظفون`
- [ ] Quick actions strip shows 4 icon-and-label tiles in one row
- [ ] Revenue chart shows a smooth uptrend with a peak call-out at
      `8,745,230` and `+24.3% ↑`
- [ ] Six month labels render under the chart and four footer stats
      sit below the divider
- [ ] AI assistant card shows a glowing globe with orbit rings and the
      `عرض التحليل الكامل` chip
- [ ] `نشاط حديث` and `مهام اليوم` sit side-by-side under the AI card
- [ ] Bottom nav stays pinned inside the phone frame (does not scroll
      with content)
- [ ] Center `+` button glows and feels premium
- [ ] No horizontal overflow at 390 px, 414 px, and 430 px widths
- [ ] No external image URLs, no people photos, no robot art
- [ ] Font renders as IBM Plex Sans Arabic — not Times New Roman
- [ ] `prefers-reduced-motion: reduce` disables the floating orbs
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
