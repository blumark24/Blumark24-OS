# C18.3-B — Internal Avatar / Persona Foundation

## Goal

Add a safe avatar/persona layer inside the internal office without claiming live presence.

## What this stage adds

Inside `FullscreenOfficeExperience.tsx`:

- Persona deck from scoped `officePeople` only.
- Employee initials.
- Employee name.
- Role or unit label.
- Explicit status: `غير متاح`.
- Overflow count for additional scoped people.

## Safety preserved

- Uses scoped office people only.
- No global employee fallback.
- No live presence claim.
- No `online` state.
- No tracking.
- No realtime presence.
- No audio/video/WebRTC.
- No message sending.
- No database writes.
- No API/Auth/RLS changes.
- No image replacement.
- No map coordinate changes.
- No `CHIP_POSITIONS` changes.
- No `rooms.map` order changes.
- No localStorage/sessionStorage.

## Product behavior

The internal office now shows a professional people/persona layer, but every persona remains explicitly `غير متاح` until the approved live-presence stage.

## Next

C18.4-A — Safe internal office interactions / persona positioning.

Rules for next stage:

- Keep personas display-only.
- Do not activate realtime.
- Do not claim active attendance.
- Do not show mic/camera controls.
