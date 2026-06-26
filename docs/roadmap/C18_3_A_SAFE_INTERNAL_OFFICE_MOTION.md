# C18.3-A — Safe Internal Office Motion

## Goal

Add safe entry, exit, and polish motion to the internal office view without moving the external map or changing office coordinates.

## What this stage adds

Inside `FullscreenOfficeExperience.tsx`:

- Safe enter motion for the full internal office shell.
- Safe exit motion before closing back to the map.
- Subtle topbar, frame, pill, command-panel, and text-room workspace motion.
- Light hover polish on safe internal cards.
- `prefers-reduced-motion` support.

## Safety preserved

- No external map movement.
- No map coordinate changes.
- No `MobileExecutiveOfficeScene.tsx` changes.
- No `CHIP_POSITIONS` changes.
- No `rooms.map` order changes.
- No image replacement.
- No image deletion.
- No generated/fake images.
- No database writes.
- No API/Auth/RLS changes.
- No message sending.
- No external invites.
- No realtime presence.
- No audio/video/WebRTC.
- No localStorage/sessionStorage.

## Product behavior

The internal office opens and closes with a premium, lightweight motion layer.

This remains visual only and does not activate meetings, live presence, voice, or video.

## Next

C18.3-B — Internal avatar/persona foundation.

Rules for next stage:

- Use existing scoped office people only.
- Do not claim live presence.
- Do not show `online` until the real presence stage.
- Keep status honest: `غير متاح` until live presence is approved.
