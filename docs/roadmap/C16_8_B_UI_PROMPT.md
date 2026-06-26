# C16.8-B UI Prompt

Implement C16.8-B — Surface meeting room governance in the safe office UI.

Use:

- `src/lib/virtual-office/officeMeetingRoomGovernance.ts`

Targets:

- `src/components/org/MobileExecutiveOfficeScene.tsx` only for compact accessibility text or tiny readiness chips.
- `src/components/org/OfficeControlModal.tsx` only if adding safe copy in the Meeting tab.

Rules:

- Do not start live meetings.
- Do not send messages.
- Do not add realtime.
- Do not add audio, video, or WebRTC.
- Do not show `join live meeting`.
- Do not change map image, aspect ratio, or coordinates.
- Do not change CHIP_POSITIONS.
- Do not redesign OfficeControlModal.
- Do not add database/API/Auth/RLS changes.
- Do not use localStorage/sessionStorage.

Scope:

- Use `resolveMeetingRoomGovernance`.
- Show safe copy such as `غرفة نصية` or `تتطلب اعتماداً`.
- Keep live rooms unavailable.

Validation:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run verify:isolation`
