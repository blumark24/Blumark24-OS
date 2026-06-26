# C16.3-D — Office Interaction State Bridge

## Goal

Prepare the final UI consumption step by defining how each office action maps to safe motion and disabled behavior.

## Added

- `src/lib/virtual-office/officeInteractionState.ts`
- `src/lib/virtual-office/__tests__/officeInteractionState.acceptance.ts`

## Why

The Virtual Command Office needs clear action states before applying motion inside `VirtualOfficeDesign.tsx`.

This keeps UI integration safe:

- board office can open its modal but cannot enter fullscreen as a normal office
- unassigned offices can open the modal for linking but cannot enter fullscreen
- future actions stay disabled
- disabled actions map to disabled motion

## Safety

- No map changes.
- No office coordinate changes.
- No `VirtualOfficeDesign.tsx` change in this PR.
- No `OfficeControlModal` redesign.
- No `FullscreenOfficeExperience` change.
- No database/API/Auth/RLS changes.
- No fake presence.
- No meetings.
- No WebRTC/audio/video/realtime.

## Next

C16.3-E can use both:

- `useVirtualOfficeMotion.ts`
- `officeInteractionState.ts`

inside `VirtualOfficeDesign.tsx` with a minimal patch only.
