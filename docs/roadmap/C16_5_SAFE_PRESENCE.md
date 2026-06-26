# C16.5 — Safe Office Presence

## Status

Current score after C16.4-B: **8.85/10**.

C16.5 starts a safe presence layer for the Virtual Command Office.

## Goal

Prepare presence logic without claiming live presence, without fake availability, and without audio/video/WebRTC.

## Added foundation

- `src/lib/virtual-office/officePresencePolicy.ts`
- `src/lib/virtual-office/__tests__/officePresencePolicy.acceptance.ts`

## Policy

Presence must be explicit, consent-aware, and source-aware.

Allowed sources:

- `none`
- `manual`
- `activity`
- `realtime`

Consent states:

- `not_requested`
- `granted`
- `denied`

## Safety rules

- No fake online status.
- No live rendering unless a future realtime channel is implemented and consent is granted.
- No audio/video/WebRTC.
- No map changes.
- No office coordinate changes.
- No modal redesign.
- No database/API/Auth/RLS changes in this phase.

## Product rule

The UI may show safe labels such as:

- غير متاح
- حضور يدوي
- آخر نشاط

The UI must not show:

- بث مباشر
- في اجتماع مباشر
- متصل الآن

unless a future realtime/consent phase explicitly enables it.

## Target

After C16.5-A merge: **8.95/10**.
