# C20-B — Office Control Modal iPhone Scroll

## Goal

Fix the office control windows shown on iPhone Safari without changing the visual identity or touching the office map.

## Problems observed from screenshots

- The modal is too tall on iPhone and visually competes with Safari controls.
- Long office content reaches the footer area and feels cut.
- Footer actions occupy too much height when many buttons are visible.
- Tabs need to stay readable while the body scrolls.
- The assignment list needs to scroll inside the modal, not push the modal window.

## What changed

- Added `src/app/virtual-office-modal.css`.
- Imported it in `src/app/layout.tsx` after `globals.css`.

The CSS is scoped to:

```css
[role="dialog"][aria-modal="true"][aria-label^="وحدة تحكم "]
```

## Mobile behavior

- Modal width is capped to iPhone-window style.
- Modal height is reduced to stay visually balanced.
- Body content scrolls internally with iOS momentum scrolling.
- Header and footer remain stable.
- Tab bar becomes sticky inside the modal body.
- Footer buttons are arranged in a compact grid.
- Small phones get tighter radius and sizing.

## Safety preserved

- No map image change.
- No office coordinate change.
- No `CHIP_POSITIONS` change.
- No `rooms.map` order change.
- No OfficeControlModal logic change.
- No virtual-office data change.
- No API/Auth/RLS change.
- No Supabase change.
- No realtime.
- No audio/video/WebRTC.
- No microphone/camera permission request.
- No localStorage/sessionStorage.

## Product behavior

The office control modal keeps the same design language, but behaves more like a professional iPhone window with clean internal scrolling.
