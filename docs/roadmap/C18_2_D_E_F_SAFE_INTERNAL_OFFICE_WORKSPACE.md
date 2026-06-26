# C18.2-D/E/F — Safe Internal Office Workspace

## Goal

Complete the safe internal office foundation without replacing existing images or activating live meetings.

## Included stages

### C18.2-D — Existing interior asset link

- Uses the saved interior image as-is.
- Registers the existing image in `officeInteriorProfile.ts`.
- Maps OFFICE 01–09 to the existing approved interior asset for the first safe activation.
- Keeps the external map crop as fallback.

### C18.2-E — Internal command panel

Adds a display-only panel inside `FullscreenOfficeExperience.tsx` with:

- Office name.
- Office number.
- Members count.
- Open tasks.
- Overdue tasks.
- Health percentage.
- Safe text-room readiness.
- Scoped member initials.

### C18.2-F — Internal text-room workspace

Adds display-only workspace areas for:

- Agenda.
- Decisions.
- Post-meeting follow-up tasks.
- Participant label.

## Safety preserved

- No image replacement.
- No image deletion.
- No generated/fake images.
- No external map changes.
- No `MobileExecutiveOfficeScene.tsx` changes.
- No `CHIP_POSITIONS` changes.
- No `rooms.map` order changes.
- No coordinate changes.
- No text persistence.
- No database writes.
- No API/Auth/RLS changes.
- No message sending.
- No external invites.
- No realtime presence.
- No audio/video/WebRTC.
- No localStorage/sessionStorage.

## Product behavior

Clicking `دخول المكتب` opens the internal office using the saved interior image and shows a lightweight operational text workspace.

This is a safe pre-meeting layer before future realtime, voice, or video stages.

## Next

C18.3-A — Safe internal office transitions and polished motion.

Rules for C18.3-A:

- Reduced-motion support.
- No map coordinate changes.
- No external map movement.
- No heavy effects.
- No realtime/audio/video/WebRTC.
