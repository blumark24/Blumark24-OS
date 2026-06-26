# C19.1-B — Live Presence UI Gate

## Goal

Show live-presence readiness inside the internal office without activating realtime.

## What this stage adds

Inside `FullscreenOfficeExperience.tsx`:

- Disabled live-presence gate panel.
- Readiness progress meter.
- Remaining safety requirements preview.
- Disabled action button.
- Honest status: `غير مفعّل`.

## Safety preserved

- UI only.
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

The internal office can now show why live presence is not enabled yet.

The panel is intentionally disabled until every readiness requirement in `livePresenceReadiness.ts` is complete.

## Next

C19.1-C — tenant-scoped presence plan.

That stage should define channel naming, tenant boundaries, payload shape, and timeout behavior before any live connection is added.
