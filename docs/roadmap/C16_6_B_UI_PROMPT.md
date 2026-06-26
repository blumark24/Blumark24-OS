# C16.6-B UI Prompt

Implement C16.6-B — Wire text-only meeting invite drafts into the safe office UI.

Use:

- `src/lib/virtual-office/officeTextMeetingInvites.ts`

Targets:

- `src/components/org/MobileExecutiveOfficeScene.tsx` only if adding non-visible accessibility text.
- `src/components/org/OfficeControlModal.tsx` only if adding a visible text-only CTA.

Rules:

- Do not send messages.
- Do not create real meetings.
- Do not add realtime.
- Do not add audio, video, or WebRTC.
- Do not show "join live meeting".
- Do not change the map.
- Do not change CHIP_POSITIONS.
- Do not change office coordinates.
- Do not redesign OfficeControlModal.
- Do not change DB/API/Auth/RLS.
- Do not use localStorage/sessionStorage.

Scope:

- Build a text-only invite draft with `buildOfficeTextMeetingInvite`.
- Show only safe copy such as `تجهيز دعوة نصية`.
- Keep external sending disabled until explicit consent and a later send phase.

Validation:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run verify:isolation`
