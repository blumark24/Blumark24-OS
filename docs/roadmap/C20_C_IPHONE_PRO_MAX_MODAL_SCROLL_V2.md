# C20-C — iPhone 15 Pro Max Modal Scroll v2

## Goal

Fix the remaining iPhone modal scroll issue reported from screenshots without changing the visual design or office logic.

## Screenshot diagnosis

The screenshots showed:

- C20-B styling was loaded, but the modal still felt too tall on iPhone Safari.
- The footer stayed readable, but the body needed a shorter smart viewport.
- The `ربط المكتب وتشغيله` section needed its own internal scroll so the unit list does not collide visually with the fixed footer.
- iPhone 15 Pro Max needed a dedicated portrait viewport rule.

## What changed

Only this file changed:

```txt
src/app/virtual-office-modal-mobile.css
```

## Behavior added

- Shorter smart modal height for mobile.
- Dedicated iPhone 15 Pro Max portrait viewport rule.
- Stronger body-only scrolling.
- Larger scroll padding around the footer.
- Internal scroll for the assignment unit list.
- Sticky save button inside the assignment section.
- Compact footer preserved.

## Safety preserved

- No React logic change.
- No `OfficeControlModal.tsx` change.
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

The same premium modal design is kept, but the window behaves more like a controlled iPhone app sheet. The body scrolls, the footer remains stable, and the assignment section manages its own long list.
