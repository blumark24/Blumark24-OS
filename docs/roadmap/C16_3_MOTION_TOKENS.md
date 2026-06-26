# C16.3-B — Safe Motion Tokens

## Goal

Prepare Virtual Command Office micro-interactions without touching the live UI map or modal design.

## Added contract

`src/lib/virtual-office/interactionMotion.ts`

This contract defines:

- idle motion
- hover motion
- focus motion
- disabled motion
- reduced-motion behavior
- transition string generation

## Safety rules

- No map changes.
- No office coordinate changes.
- No OfficeControlModal redesign.
- No FullscreenOfficeExperience change.
- No realtime.
- No fake presence.
- No meetings.
- No audio/video/WebRTC.

## Next UI PR

C16.3-C can consume `interactionMotion.ts` inside the Virtual Command Office UI.

The next UI PR must only apply existing motion tokens and must keep office data scoped through C16.2-I.

## Target

This moves C16.3 from readiness to implementation foundation.
