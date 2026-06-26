# C16.6 — Text-Only Meeting Invites

## Status

Current score after C16.5-B: **9.0/10**.

C16.6 starts text-only meeting invites for the Virtual Command Office.

## Goal

Prepare safe meeting invitation logic without enabling audio, video, WebRTC, realtime, or live meeting rooms.

## Added foundation

- `src/lib/virtual-office/officeTextMeetingInvites.ts`
- `src/lib/virtual-office/__tests__/officeTextMeetingInvites.acceptance.ts`

## Supported invite channels

- `internal_note`
- `email`
- `whatsapp`

## Safety rules

- Internal note invites do not require external-channel consent.
- External channels require explicit consent.
- Any invite requesting audio/video is blocked.
- Any invite requesting realtime is blocked.
- No DB/API/Auth/RLS changes in this phase.
- No map or coordinate changes.
- No modal redesign.

## Product rule

This phase creates text invitation drafts only. It does not send messages and does not start meetings.

## Target

After C16.6-A merge: **9.1/10**.

C16.6-B can add a visible text-only invite CTA inside safe office surfaces and raise the score toward **9.2/10**.
