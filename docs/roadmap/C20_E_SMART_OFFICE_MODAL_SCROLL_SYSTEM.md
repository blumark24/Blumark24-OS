# C20-E — Smart Office Modal Scroll System

## Goal

Keep the approved office control modal design and make the iPhone scrolling behavior smarter without redesigning the window.

## Screenshot diagnosis

The marked screenshots showed two problem zones:

1. Top mode/tabs area
   - `وضع المالك` strip and tabs felt visually compressed.
   - Tabs needed a cleaner horizontal lane.
   - The top area should not feel like overlapping layers while scrolling.

2. Assignment area
   - `ربط المكتب وتشغيله` / `تغيير الربط` is visually good, but needed smarter internal scrolling.
   - Long unit lists should scroll inside the card.
   - The footer should not fight the assignment list.

## What changed

Only this file changed:

```txt
src/app/virtual-office-modal-mobile.css
```

## Behavior added

- Small modal shrink only, not aggressive resizing.
- Better top spacing between mode strip and tabs.
- Better tab horizontal scroll lane.
- Smart assignment accordion height limit.
- Internal scroll for the unit list.
- Dedicated iPhone 15 Pro Max portrait max-height rule.
- Very small phone protection.

## Safety preserved

- No React logic change.
- No `OfficeControlModal.tsx` change.
- No header redesign.
- No footer redesign.
- No color change.
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

The modal keeps the same premium dark design. The window is slightly more compact, the top controls breathe better, and the assignment card manages long lists internally.
