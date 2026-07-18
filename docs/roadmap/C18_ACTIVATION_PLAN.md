# C18 — Activation Plan for Meetings, Effects, and Motion

## Current state

The Virtual Command Office is complete as a safe product surface.

The following are intentionally not fully active yet:

- Live meetings
- Realtime presence
- Audio/video/WebRTC
- Advanced motion effects
- Heavy visual effects

## Activation order

### C18.1 — Safe Motion and Effects

Enable richer motion and visual effects only after:

- Build passes.
- Mobile performance is verified.
- Reduced-motion accessibility is respected.
- No coordinate drift occurs on office chips.

Allowed:

- Hover polish.
- Focus polish.
- Lightweight glow.
- Reduced-motion-safe transitions.

Not allowed yet:

- Heavy animations.
- Map movement that changes coordinates.
- Effects that hide or move office hotspots.

### C18.2 — Text Meeting Rooms

Enable governed text rooms only after:

- C17-D validation passes.
- Owner/package governance is verified.
- Tenant isolation is verified.
- Meeting-room copy remains text-only.

Allowed:

- Text room preparation.
- Internal room notes.
- Approval state.
- Owner/manager controls.

Not allowed yet:

- Live audio.
- Live video.
- Realtime participant tracking.
- Automatic external invites.

### C18.3 — Realtime Presence

Enable realtime presence only after:

- Explicit user consent model exists.
- Supabase realtime rules are verified.
- Presence timeout policy is enforced.
- Cross-tenant isolation is tested.

Allowed:

- Manual status.
- Last activity label.
- Consent-based presence.

Not allowed yet:

- Silent tracking.
- Fake online status.
- Camera/microphone access.

### C18.4 — Live Meetings

Enable live meetings last.

Required before activation:

- Explicit audio/video consent.
- WebRTC or provider architecture decision.
- Device permission flow.
- Recording policy.
- Privacy policy update.
- Load test.
- Owner/admin kill switch.

## Practical schedule

Recommended order:

1. Finish C17-D validation.
2. Activate safe motion/effects first.
3. Activate text meeting rooms second.
4. Activate consent-based realtime presence third.
5. Activate live meetings last.

## Release rule

Do not activate live meetings or realtime until the validation checklist passes and the user consent flow is implemented.
