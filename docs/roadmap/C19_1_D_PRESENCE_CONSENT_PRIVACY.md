# C19.1-D — Presence Consent and Privacy

## Goal

Prepare explicit user consent and privacy language before any live presence activation.

This stage does not enable realtime, online status, tracking, audio, or video.

## What this stage adds

```txt
src/lib/virtual-office/presenceConsentPolicy.ts
src/lib/virtual-office/__tests__/presenceConsentPolicy.acceptance.ts
src/components/org/PresenceConsentPreview.tsx
```

## Consent policy covers

- What is shared: manual presence status.
- Where it is shared: scoped tenant and office only.
- Who controls it: the user controls the status manually.
- Stop sharing: must be available before activation.
- Timeout: status expires automatically.
- No audio/video: presence does not start camera or microphone.
- No silent tracking: no hidden behavioral tracking.

## Policy states

```txt
blocked  — privacy requirements are missing
preview  — consent text can be shown, activation still disabled
approved — user accepted after all requirements are complete
```

## UI component

`PresenceConsentPreview.tsx` is a disabled, reusable preview panel for the consent gate.

It shows:

- Consent title.
- Readiness count.
- Summary.
- First privacy items.
- Disabled action button.

## Safety preserved

- No realtime activation.
- No live attendance state.
- No online state.
- No Supabase channel code.
- No database writes.
- No API/Auth/RLS changes.
- No voice/video/WebRTC.
- No message sending.
- No image replacement.
- No map coordinate changes.
- No `CHIP_POSITIONS` changes.
- No `rooms.map` order changes.
- No localStorage/sessionStorage.

## Product behavior

The project now has a reusable consent and privacy gate for the future presence flow.

Current virtual office remains honest and inactive until consent, tenant scope, office scope, server validation, and RLS are all ready.

## Next

C19.2-A — Meeting controls readiness plan.

That stage can define disabled controls for:

- Start meeting.
- Microphone.
- Camera.
- Screen share.
- Leave meeting.

All controls must remain disabled until security and realtime gates are complete.
