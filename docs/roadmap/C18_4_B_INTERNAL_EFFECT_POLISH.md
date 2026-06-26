# C18.4-B — Internal Effect Polish

## Goal

Add lightweight visual polish to the internal office while keeping the feature display-only.

## What this stage adds

Inside `FullscreenOfficeExperience.tsx`:

- Room-readiness glow.
- Selected persona spotlight.
- Selected persona focus ring.
- Text-room readiness visual accent.
- Persona focus-card polish.
- Reduced-motion support for all new effects.

## Safety preserved

- Visual effects only.
- No live attendance state.
- No online state.
- No realtime feature.
- No voice or video feature.
- No message sending.
- No database writes.
- No API/Auth/RLS changes.
- No image replacement.
- No external map movement.
- No external map coordinate changes.
- No `CHIP_POSITIONS` changes.
- No `rooms.map` order changes.
- No localStorage/sessionStorage.

## Product behavior

The internal office now feels more premium and responsive while staying display-only.

Selecting a persona changes only local UI focus and visual emphasis inside the already-open office view.

## Next

C19.1-A — Safe presence readiness plan.

The next stage should define requirements first and keep the UI honest until backend validation is complete.
