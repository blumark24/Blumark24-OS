# C19.1-A — Live Presence Readiness Gate

## Goal

Prepare the virtual office for future live presence without activating realtime tracking yet.

This stage is a safety gate, not a live-presence implementation.

## Why this stage exists

Live presence can expose sensitive behavioral signals if activated too early.

Before any realtime presence is enabled, Blumark24 OS must define and verify:

- Tenant isolation.
- Explicit user consent.
- Manual status control.
- Idle timeout.
- Stop-sharing control.
- RLS policy readiness.
- Privacy notice readiness.
- Server-side validation.
- No silent tracking.

## Added files

```txt
src/lib/virtual-office/livePresenceReadiness.ts
src/lib/virtual-office/__tests__/livePresenceReadiness.acceptance.ts
```

## Product state

Current UI remains honest:

```txt
غير متاح
لا حضور لحظي
لا تتبع
لا realtime
لا صوت
لا فيديو
```

## Technical policy

The readiness gate returns:

- `blocked` when safety requirements are mostly missing.
- `partial` when part of the gate is ready but activation is still blocked.
- `ready` only when every requirement is complete.

Live presence must not be enabled unless:

```txt
canEnableLivePresence === true
```

## Supabase note

Supabase Presence is a future candidate for slow-changing state such as online/offline status or active room state.

It must not be used for high-frequency movement, cursor tracking, or silent behavioral tracking.

## Safety preserved

- No realtime activation.
- No live attendance state.
- No online state.
- No database writes.
- No API/Auth/RLS changes.
- No Supabase channel code.
- No audio/video/WebRTC.
- No message sending.
- No image replacement.
- No map coordinate changes.
- No `CHIP_POSITIONS` changes.
- No `rooms.map` order changes.
- No localStorage/sessionStorage.

## Next

C19.1-B — Live presence UI gate.

That next stage can show a disabled readiness panel inside the virtual office, but it must not activate realtime yet.
