# C16.5-B UI Prompt

Implement C16.5-B — Wire safe office presence into UI labels.

Use:

- `src/lib/virtual-office/officePresencePolicy.ts`

Targets:

- `src/components/org/VirtualOfficeDesign.tsx`
- `src/components/org/OfficeControlModal.tsx` only if needed

Rules:

- Do not show fake availability.
- Do not show "متصل الآن".
- Do not show live meeting presence.
- Do not add realtime.
- Do not add audio, video, or WebRTC.
- Do not change office map or coordinates.
- Do not change CHIP_POSITIONS.
- Do not redesign OfficeControlModal.
- Do not change DB/API/Auth/RLS.
- Do not use localStorage/sessionStorage.

Scope:

- Replace any hardcoded future presence copy with safe policy-driven labels.
- Default state must remain `غير متاح` unless a permitted source exists.
- Keep presence as display-only.

Validation:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run verify:isolation`
