# C20-B — iPhone Smart Modal Scroll

## Goal

Refine the office control modal for iPhone Safari without changing the design identity or touching office data, images, coordinates, or React logic.

## Screenshot diagnosis

The uploaded iPhone screenshots showed that the visual design is good, but the modal needed smarter window behavior:

- The modal was too tall for the usable iPhone Safari viewport.
- Footer actions competed with body content.
- The assignment list and long sections needed clearer internal scrolling.
- Tabs needed to remain readable while the body scrolls.
- The footer needed to stay compact and stable.

## What changed

Only this file changed:

```txt
src/app/virtual-office-modal-mobile.css
```

## Mobile behavior

- Modal width is capped to a compact iPhone-style window.
- Modal height is reduced to fit the dynamic Safari viewport.
- Header remains stable.
- Footer remains stable.
- Body content scrolls internally with iOS momentum scrolling.
- Tab bar is sticky inside the body.
- Footer buttons use a compact two-column layout.
- Very small phones receive a slightly smaller modal height and radius.

## Safety preserved

- No `OfficeControlModal.tsx` logic change.
- No map image change.
- No office coordinate change.
- No `CHIP_POSITIONS` change.
- No `rooms.map` order change.
- No virtual-office data change.
- No API/Auth/RLS change.
- No Supabase change.
- No realtime.
- No audio/video/WebRTC.
- No microphone/camera/screen permission request.
- No localStorage/sessionStorage.

## Product behavior

The modal keeps the same premium dark visual style, but behaves more like a professional iPhone window: compact, stable, and internally scrollable.
