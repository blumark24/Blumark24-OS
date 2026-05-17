# B24 OS — Phase 0: Performance & Routing Stabilization Report

Scope: **Phase 0 only**. No redesign, no new features, no Supabase schema or migration changes, no auth-flow logic changes, no dashboard or `/demo` behavior changes. Pure stabilization of load behavior and routing safety.

---

## 1. Root cause of "stuck on loading screen"

A cascade of three layers, each of which could individually freeze the UI for tens of seconds before this phase:

| Layer | Cause | Worst-case wait before fix |
|---|---|---|
| AuthContext | `supabase.auth.getSession()` could take up to **10 s** before unblocking; a stale `blumark_session=1` cookie could pass middleware while the real session was already invalid, producing redirect loops | 10 s + redirect loop risk |
| PermissionsContext | Two unbounded queries on every user.id change (`getAllProfiles`, `role_permissions`). No timeout. Header & Sidebar wait for these to render meaningful state | Unbounded (only fail if Supabase eventually responds) |
| NotificationsContext + MessagesContext | Both fired on mount **unconditionally** — even before the user existed and even on the public landing/auth pages. No timeout | Unbounded |
| PageGuard + dashboard root | Both rendered a blank full-viewport spinner with `background: #0a1628` while auth resolved — user sees a black screen, no chrome, no skeleton, no progress signal | Blocks visible UI for the duration of the AuthContext stall |
| Header global search | Promise.all of 3 parallel Supabase queries with no timeout — a slow network could freeze the search dropdown | Unbounded |

The combined worst-case experience: black screen for 10 s → empty Header dropdowns for an unbounded time → permission-guarded pages stuck on spinners. **Now each layer has a bounded budget and renders something useful immediately.**

---

## 2. Files changed (8 files, all in scope)

| File | What changed | Why |
|---|---|---|
| `src/contexts/AuthContext.tsx` | Hard timeout 10 s → **5 s**. On `getSession()` returning no session OR throwing, **clear stale `blumark_session` cookie**. | Bound the worst-case spinner. Eliminate redirect-loop risk between middleware (cookie check) and AuthContext (live session check). |
| `src/contexts/PermissionsContext.tsx` | Wrap `getAllProfiles()` and `role_permissions` SELECT in `withSoftTimeout(6 s)`. Add cancellation on unmount. | Background data — never blocks Sidebar/Header rendering. On expiry: silent fall-back to in-memory `DEFAULT_ROLE_PERMISSIONS`. |
| `src/contexts/NotificationsContext.tsx` | Gate `load()` and realtime subscription on `user?.id`. Wrap `getNotifications()` in `withSoftTimeout(6 s)`. | No work on landing/auth pages. No work during initial auth resolve. No hang on slow Supabase. |
| `src/contexts/MessagesContext.tsx` | Same treatment as Notifications (added `useAuth` import, gated on `user?.id`, soft timeout). | Same reasons. |
| `src/components/layout/Header.tsx` | Wrap the 3-way `Promise.all` search in `withTimeout(8 s)`; on expiry or network error, silently return `[]`. | Search dropdown never hangs the header on a slow network. |
| `src/components/ui/PageGuard.tsx` | While `loading`: render the dashboard chrome (`DashboardLayout`) with two `CardSkeleton`s instead of a full-viewport spinner. | The 8 protected routes show **shell + skeleton** within ~50 ms instead of a black screen. |
| `src/app/page.tsx` (dashboard `/`) | While auth `loading`: render `DashboardLayout` with 4 `KPICardSkeleton`s + 2 `ChartSkeleton`s instead of full-viewport spinner. Then once `user` is known, render landing or dashboard. | Same UX improvement on the most-visited route. |

No file outside the targeted list was modified. No schema, migration, package.json, or routing config was touched.

---

## 3. Per-page independence (item 2 in the brief)

Verified each listed route is its own independent `page.tsx` and loads only its own data hooks. No new routes added, no existing routes split or merged.

| Route | File | Data hooks (only its own) |
|---|---|---|
| `/` (dashboard) | `src/app/page.tsx` | `useDashboardKPI`, `useProjects`, `useActivities`, `useTransactions`, `useEmployees`, `useClients` — aggregate by design (KPI view). Each hook has its own 15 s timeout via `withTimeout`. |
| `/employees` | `src/app/employees/page.tsx` | `useEmployees` only |
| `/tasks` | `src/app/tasks/page.tsx` | `useTasks`, `useClients`, `useEmployees` (the latter two only for assignee/client dropdown options) |
| `/clients` | `src/app/clients/page.tsx` | `useClients` only |
| `/finance` | `src/app/finance/page.tsx` | `useTransactions` only |
| `/strategy` | `src/app/strategy/page.tsx` | own page-local hooks |
| `/reports` | `src/app/reports/page.tsx` | own page-local hooks |
| `/settings` | `src/app/settings/page.tsx` | own page-local hooks |

✅ Each page is an independent route. ✅ Each page loads only its own data (with the dashboard `/` being the deliberate exception — it's a KPI summary).

---

## 4. AuthProvider / Sidebar NOT fetching system-wide data on boot (items 4 & 5)

- **AuthProvider** still does what it must: one `getSession()`, one optional `profiles` row read for the current user via `buildUser()`, one optional `(avatar_url, force_password_change)` extension read. **No system-wide data fetching.** It does **not** fetch any business tables.
- **Sidebar** does NOT execute any Supabase queries. It only consumes `useAuth()`, `useToast()`, `usePermissions()`. Its `visibleItems` calculation is pure JS array filtering. **No queries triggered by Sidebar render.** Confirmed by full read of `src/components/layout/Sidebar.tsx`.
- The system-wide data that previously fired on boot was:
  - `getAllProfiles()` and `role_permissions` from PermissionsContext → now soft-timeout + cancellation-aware.
  - `getNotifications()` and `getMessages()` from the global providers → now gated on `user?.id`, so they no longer fire on landing/auth or during the auth-resolve window.

---

## 5. Per-page loading skeleton (item 6)

The full-screen blocking spinner used at `PageGuard` and the dashboard `/` route is replaced with:

- **PageGuard** → `<DashboardLayout>` + `<CardSkeleton rows={3} />` + `<CardSkeleton rows={4} />`. Sidebar, Header, debug banner all render live. Content area shows two shimmering cards.
- **Dashboard `/`** → `<DashboardLayout>` + a 4-column KPI skeleton grid + two chart skeletons. Visually matches the resolved KPI dashboard so there's no layout shift on data arrival.

The existing `KPICardSkeleton`, `CardSkeleton`, `ChartSkeleton`, `TableRowSkeleton`, `StatSkeleton` components in `src/components/ui/Skeleton.tsx` were reused as-is — no new skeleton primitives added.

---

## 6. Timeout / fallback when Supabase is slow (item 7)

All previously-unbounded query sites now have explicit budgets:

| Site | Helper | Budget | On expiry |
|---|---|---|---|
| `AuthContext` initial getSession | inline `setTimeout` | **5 s** | `loading=false`, cookie cleared, app proceeds. The existing `onAuthStateChange` listener will still pick up a late session. |
| `PermissionsContext.getAllProfiles()` | `withSoftTimeout` | 6 s | resolve undefined → keep current `managedUsers` |
| `PermissionsContext.role_permissions select` | `withSoftTimeout` | 6 s | resolve undefined → fall back to `DEFAULT_ROLE_PERMISSIONS` |
| `NotificationsContext.getNotifications` | `withSoftTimeout` | 6 s | resolve undefined → keep current notifications (empty on first try) |
| `MessagesContext.getMessages` | `withSoftTimeout` | 6 s | resolve undefined → keep current messages |
| Header search (3-way Promise.all) | `withTimeout` | 8 s | catch → return `[]` from `searchSupabase`, dropdown shows empty state |
| All `useData` table reads (clients/tasks/finance/etc.) | `withTimeout` (pre-existing) | 15 s | error surfaced to the page — already implemented in `src/hooks/useData.ts:212` |
| All `useData` writes | `withTimeout` (pre-existing) | 12 s | error surfaced to the modal — already implemented |

All new timeouts use the **existing** helpers in `src/lib/asyncHelpers.ts` (`withTimeout`, `withSoftTimeout`). No new helper, no third-party dep.

---

## 7. Light page guard (item 8)

PageGuard remains the existing single source of permission gating for the 8 protected routes:
`/employees`, `/tasks`, `/clients`, `/finance`, `/automation`, `/reports`, `/strategy`, `/settings`.

It is now **lighter** in the loading state — it renders the same layout the resolved page will use, with skeletons in the content area, instead of replacing the entire viewport with a black spinner.

The guard still:
- Derives `resolvedRole` directly from `AuthContext.user.role` (not from `PermissionsContext` state) to avoid the one-render lag that produced super_admin "access denied" flashes on hard refresh.
- Renders the access-denied screen inside `DashboardLayout` so the user keeps the navigation chrome.

---

## 8. Redirects audited; loop risk closed (item 9)

Three redirect sites in the protected app:

| Site | File:line | Action |
|---|---|---|
| Middleware: unauthenticated protected path | `middleware.ts:58–61` | → `/auth?redirect=<path>` |
| Middleware: `/auth` while authenticated | `middleware.ts:43–46` | → `/` |
| AuthContext: no user on protected path | `src/contexts/AuthContext.tsx:194–195` | → `/auth?redirect=<path>` |
| AuthContext: user on `/auth` | `src/contexts/AuthContext.tsx:196–197` | → `/` |
| AuthContext: forcePasswordChange | `src/contexts/AuthContext.tsx:198–199` | → `/settings?tab=account` |

**Closed loop**: Middleware's `hasAuthSession()` reads the cookie. Previously, if a session expired server-side but the cookie was still present, middleware allowed `/employees` → AuthContext detected no user → redirected to `/auth` → middleware saw cookie → bounced back. **Now**, when AuthContext's initial `getSession()` returns no session (or fails), it explicitly clears the cookie before unblocking the UI. Subsequent middleware reads will see no cookie and let `/auth` render normally.

No other loop paths detected. Public paths (`/`, `/auth`, `/auth/*`, `/demo`) remain accessible regardless of auth state.

---

## 9. Validation

| Command | Result |
|---|---|
| `npm run lint` | ✅ pass — 0 errors. 1 pre-existing baseline warning (`@next/next/no-page-custom-font` on `src/app/layout.tsx:27`, unrelated to this phase). |
| `npx tsc --noEmit` | ✅ pass — `EXIT=0`. |
| `npm run build` | ✅ pass — **20/20 routes** generated with placeholder Supabase env vars. Route map identical to baseline (no routes added/removed). |

Per-route bundle sizes after Phase 0 (selected):

| Route | First Load JS | Δ vs pre-phase |
|---|---|---|
| `/` | 302 kB | unchanged |
| `/employees` | 191 kB | +0.4 kB (added `CardSkeleton` import via PageGuard) |
| `/clients` | 291 kB | +0.4 kB (same) |
| `/finance` | 302 kB | +0.4 kB (same) |
| `/settings` | 195 kB | +0.4 kB (same) |
| `/auth` | 160 kB | unchanged |
| `/demo` | 215 kB | **unchanged** — demo path verified untouched |
| Shared chunks | 87.3 kB | unchanged |

The ~0.4 kB increase on protected routes is the cost of `CardSkeleton` now reaching the PageGuard bundle. Negligible.

---

## 10. Out of scope (intentionally not touched)

- Supabase schema, RLS policies, migrations, data — **no edits**.
- `package.json` scripts, dependency versions — **no edits**.
- Routing layout, middleware matcher list, page hrefs — **no edits** (only added a cookie-clear inside AuthContext).
- Sidebar UI (PR #78 work) — **no edits** here; it remains a pure view consumer of `useAuth` / `usePermissions`.
- DemoSidebar / `/demo` page / DemoDashboardPage — **no edits**.
- DashboardHome content layout, chart components, KPI cards — **no edits**.
- Brand, colors, theme tokens, fonts — **no edits**.
- AI / automation / admin-recovery feature surface area — **no edits**.

---

## 11. What this phase deliberately did NOT do

Per the brief:

- No redesign.
- No identity changes (colors, logo, typography untouched).
- No new features. No new pages. No new database tables.
- No bundle code-splitting for the 349 K Recharts chunk on `/` — this is the one Phase 1 / 2 candidate (`next/dynamic` lazy-load of `recharts` on dashboard). Noted but **out of scope here** because it would require refactoring chart imports on the dashboard page.
- No removal of the existing `console.log("Permissions userRole:", …)` debug line on `src/contexts/PermissionsContext.tsx:244` — non-impactful and outside Phase 0 scope (logic change).

---

## 12. Stop point

Per the brief — Phase 0 complete, report written. Stopping here. No further work without explicit approval.
