# C16.3-C — Motion UI Adapter

## Goal

Bridge the safe motion tokens into a UI-ready adapter without changing the live Virtual Command Office layout yet.

## Added

- `src/lib/virtual-office/useVirtualOfficeMotion.ts`
- `src/lib/virtual-office/__tests__/useVirtualOfficeMotion.acceptance.ts`

## What it provides

- `useVirtualOfficeReducedMotion()`
- `useVirtualOfficeMotionStyle()`
- `getVirtualOfficeMotionStyle()`

## Safety

- No map changes.
- No office coordinate changes.
- No OfficeControlModal redesign.
- No FullscreenOfficeExperience change.
- No sidebar/header/global layout changes.
- No database/API/Auth/RLS changes.
- No WebRTC/audio/video/realtime.
- No fake presence.
- No meetings.

## Next

C16.3-D can consume `useVirtualOfficeMotionStyle()` in the exact office interaction elements, with no data or layout changes.
