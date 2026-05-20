# DESIGN SYSTEM ROLLOUT PLAN (AI OS Premium)

## 1) Dashboard visual system summary
The `/dashboard` page is the visual reference baseline for the premium AI OS style:
- Dark navy foundation with layered gradients.
- Glassmorphism panels (`backdrop-blur`, soft borders, low-opacity fills).
- Cyan/blue/purple ambient glows for hierarchy and focus.
- Arabic RTL-first spacing and text alignment.
- Mobile-first card stack, then tablet/desktop expansion.
- Safe-area aware bottom spacing and `dvh`-safe modal/sheet patterns.

## 2) Reusable local design tokens (current dashboard scope)
These are local tokens already proven on dashboard and should be reused section-by-section before global extraction:
- **surface panel**: hero/section container with gradient + blur + soft border.
- **glass card**: metric and content cards with subtle elevation.
- **icon orb**: circular/squircle icon holder with tinted glow ring.
- **glow border**: semantic accent border/shadow (cyan, emerald, amber, rose).
- **live pill**: compact status/streaming badge.
- **section header**: title + small helper text/action.
- **action card**: quick-action tile with icon + label + chevron.
- **mobile nav item**: large touch targets, active tint, compact label.

## 3) Section-by-section redesign plan
> Note: Tasks is already covered in PR #109 and is intentionally excluded from this PR.

### 3.1 Clients (`/clients`) — Priority 1
- Convert current summary and analytics blocks to premium glass cards.
- Keep filters/search behavior exactly as-is; upgrade only shell and spacing.
- Add mobile card rhythm consistency with dashboard KPI spacing.

### 3.2 Employees (`/employees`) — Priority 2
- Preserve existing create/edit/delete and auth helper flows unchanged.
- Modernize list/table shells, status chips, and section headers.
- Make modal density/touch ergonomics match dashboard modal language.

### 3.3 Finance (`/finance`) — Priority 3
- Elevate KPI + trend cards to same neon-glass palette.
- Preserve existing calculations and data hooks.
- Improve dense table readability and responsive wrapping.

### 3.4 Reports (`/reports`) — Priority 4
- Unify charts/cards under dashboard token system.
- Keep all report generation/filter logic untouched.
- Standardize empty/loading/error visual states.

### 3.5 AI Assistant (`/ai`) — Priority 5
- Align chat/prompt surfaces to premium panel and bubble system.
- Keep provider/data behavior untouched.
- Improve mobile sticky input area with safe-area handling.

### 3.6 Settings (`/settings`) — Priority 6
- Convert settings groups into card sections and section headers.
- Preserve every setting behavior and save/update flow.
- Ensure readable form density on 360–430 widths.

## 4) Priority order
1. Tasks (already in PR #109)
2. Clients
3. Employees
4. Finance
5. Reports
6. AI Assistant
7. Settings

## 5) Safety rules for future section PRs
For every redesign PR in this rollout:
- UI-only changes unless explicitly approved otherwise.
- Do not touch AuthContext, PermissionsContext, middleware, Supabase client, routes, schema, or migrations.
- Do not add mockData/localStorage shortcuts.
- Do not alter existing hooks behavior or KPI/CRUD logic.
- Keep loading/error/empty states present.
- Keep all actions wired to existing handlers.

## 6) Mobile-first rules
- Design from 360/390/414/430 first, then scale up.
- Prevent horizontal overflow (`min-w-0`, `truncate`, `line-clamp`, scroll wrappers).
- Use `dvh/svh` and safe-area insets for full-height overlays.
- Maintain touch targets around 44px minimum.
- Keep RTL readability and avoid icon/text collisions.

## 7) Components to standardize later (after rollout stabilizes)
- Premium section container.
- KPI stat card (semantic variants).
- Reusable section header row.
- Activity list item.
- Action tile grid.
- Responsive data table shell + mobile card fallback.
- Modal/sheet wrapper with `dvh` + safe-area defaults.

## 8) Risks and constraints
- Visual parity can drift across pages without a shared token package; mitigate by copying proven local tokens until extraction.
- Data-rich tables can regress on mobile if fixed widths are reintroduced.
- Sandbox build validation is limited when Supabase env vars are absent.
- Cross-browser blur/glow rendering differs slightly (especially Safari vs Chromium); verify contrast/readability in QA.
