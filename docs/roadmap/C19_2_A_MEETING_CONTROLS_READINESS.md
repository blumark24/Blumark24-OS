# C19.2-A — Meeting Controls Readiness

## Goal

Prepare disabled meeting controls for the future voice/video stage without activating audio, camera, screen share, or WebRTC.

This stage is a readiness and UI-preview layer only.

## What this stage adds

```txt
src/lib/virtual-office/meetingControlsReadiness.ts
src/lib/virtual-office/__tests__/meetingControlsReadiness.acceptance.ts
src/components/org/MeetingControlsPreview.tsx
src/components/org/__tests__/MeetingControlsPreview.acceptance.tsx
```

## Disabled controls prepared

- Start meeting.
- Microphone.
- Camera.
- Screen share.
- Leave meeting.

## Requirements before enabling

- Live presence ready.
- User consent approved.
- Tenant scope ready.
- Office scope ready.
- Server validation ready.
- RLS ready.
- Media permission policy ready.
- Stop control ready.

## Important behavior

Even when all requirements are ready, this stage keeps all controls disabled.

Actual audio/video must be implemented in a later WebRTC-specific stage.

## Safety preserved

- No audio is requested.
- No camera is requested.
- No screen share is requested.
- No WebRTC is added.
- No realtime channel is created.
- No online status is shown.
- No live attendance is enabled.
- No Supabase channel code is added.
- No database writes.
- No API/Auth/RLS changes.
- No message sending.
- No image replacement.
- No map coordinate changes.
- No `CHIP_POSITIONS` changes.
- No `rooms.map` order changes.
- No localStorage/sessionStorage.

## Product behavior

The project now has a safe, disabled meeting-controls foundation. It can be rendered later inside the internal office without asking for microphone or camera permissions.

## Next

C19.2-B — Add disabled meeting controls into the internal office panel.

That stage can import `MeetingControlsPreview` and place it inside the office UI, still disabled.
