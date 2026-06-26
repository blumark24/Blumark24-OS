# C18.2-F — Internal Text Room Workspace

## Goal

Add a safe text-room workspace inside the internal office view.

## What this stage adds

Inside `FullscreenOfficeExperience.tsx`, the internal command panel now includes:

- Text-room status.
- Participant label.
- Agenda.
- Decisions area.
- Post-meeting follow-up tasks.

## Safety preserved

- Display-only UI.
- No text persistence.
- No database writes.
- No API/Auth/RLS changes.
- No message sending.
- No external invites.
- No realtime presence.
- No audio/video/WebRTC.
- No localStorage/sessionStorage.
- No image replacement.
- No map coordinate changes.
- No `CHIP_POSITIONS` changes.
- No `rooms.map` order changes.

## Product behavior

The internal office now shows a structured, meeting-like text workspace without activating live meetings.

This is intentionally a safe pre-meeting layer before any realtime, voice, or video capability.

## Next

C18.3-A can add safe internal-office transitions:

- Enter office motion.
- Exit to map motion.
- Panel polish.
- Reduced-motion support.

No map coordinates should change.
