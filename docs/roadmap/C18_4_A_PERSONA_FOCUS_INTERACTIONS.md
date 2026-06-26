# C18.4-A — Persona Focus Interactions

## Goal

Add safe, display-only interaction for internal office personas without enabling live presence.

## What this stage adds

Inside `FullscreenOfficeExperience.tsx`:

- Persona positioning chips inside the internal office scene.
- Click-to-focus persona cards in the internal command panel.
- Selected persona highlight.
- Read-only persona focus card.
- Explicit status remains `غير متاح`.

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
- No external map coordinate changes.
- No `CHIP_POSITIONS` changes.
- No `rooms.map` order changes.
- No localStorage/sessionStorage.

## Product behavior

The internal office now has a professional interactive persona layer. Selecting a persona only changes local UI focus inside the already-open office view.

It does not persist, track, notify, message, or imply attendance.

## Next

C18.4-B — Safe internal office effect polish for persona focus and room readiness.

Rules for next stage:

- Visual polish only.
- Keep reduced-motion support.
- Do not add realtime/audio/video.
- Do not show mic/camera controls.
