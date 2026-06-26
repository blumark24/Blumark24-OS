# C18.2-E — Internal Office Command Panel

## Goal

Improve the internal office view after `دخول المكتب` without changing or replacing any saved images.

## What this stage adds

A display-only command panel inside `FullscreenOfficeExperience.tsx` showing:

- Office name and number.
- Existing interior image status.
- Members count.
- Open tasks count.
- Overdue tasks count.
- Health percentage.
- Text-room readiness.
- Small member initials from scoped office people.

## Safety preserved

- No image replacement.
- No image deletion.
- No generated or fake images.
- No external map changes.
- No `MobileExecutiveOfficeScene.tsx` changes.
- No `CHIP_POSITIONS` changes.
- No `rooms.map` order changes.
- No coordinate changes.
- No database writes.
- No API/Auth/RLS changes.
- No realtime presence.
- No audio/video/WebRTC.
- No localStorage/sessionStorage.

## Product behavior

The internal office now feels like a working command room while staying safe and display-only.

The panel does not start meetings, send messages, track live presence, or create fake activity.

## Next

C18.2-F can add a safe text-room workspace inside the internal office view: agenda, notes, decisions, and post-meeting tasks. This must remain local display/state only unless a later backend/RLS stage is approved.
