# C22-C — Claude Smart Windows + Interior Assets Adapter

## Scope

C22-C adapts the Claude Design direction as a reference only for the existing `/virtual-office` experience. It keeps the approved 9-office map, office numbers, slot positions, API-backed mapping handlers, and tenant data flow intact.

## Ported

- Improved the approved `OfficeControlModal` header with office number, office name, office function/type, status, and privacy/security context.
- Added a Smart Assignment Panel inside the existing mapping section.
- Added live search across real org units by:
  - unit name
  - unit type label
  - unit code
- Preserved selected org-unit state and the existing API-backed save handler.
- Registered 9 interior asset profiles:
  - `office-01-executive-interior`
  - `office-02-open-workspace-interior`
  - `office-03-analytics-interior`
  - `office-04-design-studio-interior`
  - `office-05-board-room-interior`
  - `office-06-marketing-interior`
  - `office-07-data-office-interior`
  - `office-08-operations-interior`
  - `office-09-command-center-interior`
- Added the 9 WebP interior office assets under `public/virtual-office/interiors/`.
- Kept Office 05 as Board Room / مجلس الإدارة.
- Added an interior asset adapter in fullscreen office entry. If a dedicated interior image is not available, it falls back to a safe crop of the current external office map.

## Intentionally Not Ported

- No `index.html`.
- No replacement of `/virtual-office`.
- No external virtual office map change.
- No office positions, office numbers, `CHIP_POSITIONS`, `rooms.map`, or 9-office layout changes.
- No Supabase, Auth, RLS, migrations, Owner Panel, or tenant isolation changes.
- No mock org units, mock employees, or invented assignments.
- No localStorage/sessionStorage.
- No realtime, audio, video, or WebRTC.
- No new API routes.

## Desktop Acceptance Checklist

- `/virtual-office` keeps the current external 9-office map.
- Office Control Modal opens and closes with the existing scroll lock and overlay click-to-close behavior.
- Header shows office number, name, type/function, status, and privacy/security badge.
- Smart Assignment Panel searches real org units only.
- Save button is active only when the selected unit differs from the current mapping.
- Entering an office shows the registered interior profile adapter.
- Missing interior assets fall back to a crop of the current external office map.

## Mobile Acceptance Checklist

- Modal remains scroll-safe and contained within the viewport.
- Assignment search input does not create horizontal overflow.
- Empty search results are truthful.
- Fullscreen office entry keeps the HUD usable.
- Interior asset adapter remains compact and does not cover core actions.
- No bottom navigation or global layout changes.
