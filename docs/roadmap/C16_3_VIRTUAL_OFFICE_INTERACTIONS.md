# C16.3 — Virtual Command Office Micro-Interactions

## Status

Current product score after C16.2-I: **8.5/10**.

C16.3 starts the premium interaction layer for the Virtual Command Office.

## Scope

C16.3 is intentionally limited to safe interaction polish:

- subtle hover and focus behavior
- safe transition timing
- reduced-motion friendly behavior
- clearer disabled states for future actions
- no fake presence
- no meetings yet
- no WebRTC, audio, video, or realtime

## Non-negotiable constraints

- Do not change the 9-office map.
- Do not change office coordinates.
- Do not redesign OfficeControlModal.
- Do not change the sidebar, header, or global layout.
- Do not add localStorage or sessionStorage.
- Do not add database, API, RLS, Auth, or Supabase changes in this phase.
- Do not introduce voice, video, camera, screen share, or live meeting logic.

## Interaction order

1. C16.3 — Micro-interactions
2. C16.4 — Smart suggestions
3. C16.5 — Real presence foundation
4. C16.6 — Meeting invites without audio/video
5. C16.8 — Audio/video meetings only after explicit consent and owner controls

## Acceptance checks

- OFFICE 01 keeps scoped data only.
- OFFICE 05 remains the board office.
- OFFICE 09 keeps scoped data only.
- Unassigned offices remain empty until linked.
- Motion can be disabled or reduced.
- No data boundary is changed.

## Target

After C16.3 completion: **8.6/10**.
