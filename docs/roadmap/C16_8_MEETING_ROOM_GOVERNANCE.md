# C16.8 — Meeting Room Governance

## Status

Current score after C16.7-B: **9.5/10**.

C16.8 starts governed meeting rooms for the Virtual Command Office.

## Goal

Prepare permission-aware meeting room governance without starting live rooms, sending invites, enabling realtime, or adding audio/video.

## Added foundation

- `src/lib/virtual-office/officeMeetingRoomGovernance.ts`
- `src/lib/virtual-office/__tests__/officeMeetingRoomGovernance.acceptance.ts`

## Governance modes

- `inactive`
- `text_only`
- `approval_required`

## Audience levels

- `owner`
- `manager`
- `employee`

## Safety rules

- Text rooms can be prepared only when the office is linked and the audience is allowed.
- Employees can view status only.
- Unassigned offices stay locked.
- Board office can prepare a text room for owner-level users.
- Live rooms remain unavailable.
- No realtime.
- No audio/video/WebRTC.
- No database/API/Auth/RLS changes in this phase.
- No map or coordinate changes.

## Product rule

This phase creates governance only. It does not open a live meeting room and does not send messages.

## Target

After C16.8-A merge: **9.6/10**.

C16.8-B can surface meeting-room governance in the safe UI and raise the score toward **9.7/10**.
