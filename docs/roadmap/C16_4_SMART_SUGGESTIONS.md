# C16.4 — Virtual Command Office Smart Suggestions

## Status

Current score after C16.3-D: **8.65/10**.

C16.4 starts the smart suggestion layer for the Virtual Command Office.

## Goal

Provide safe, scoped, deterministic suggestions for each office without external AI calls and without reading data outside the office scope.

## Added foundation

- `src/lib/virtual-office/officeSmartSuggestions.ts`
- `src/lib/virtual-office/__tests__/officeSmartSuggestions.acceptance.ts`

## Safety rules

- No map changes.
- No office coordinate changes.
- No modal redesign.
- No database/API/Auth/RLS changes.
- No fake data.
- No meetings.
- No realtime.
- No audio/video/WebRTC.
- Suggestions must come only from scoped summary values.

## Suggestion cases

- Unassigned office: `link_required`
- Restricted user: `restricted`
- Board office: `board_summary`
- Overdue tasks: `overdue_tasks`
- Open tasks: `open_tasks`
- Linked empty team: `empty_team`
- Healthy office: `healthy`
- Default: `ready`

## Next PR

C16.4-B should wire `officeSmartSuggestions.ts` into `VirtualOfficeDesign.tsx` using only scoped values already produced by C16.2-I.

## Target

After C16.4-A merge: **8.75/10**.
