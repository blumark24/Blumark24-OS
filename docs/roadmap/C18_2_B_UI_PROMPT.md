# C18.2-B UI Prompt

Implement C18.2-B — Surface text meeting room readiness in the Virtual Command Office UI.

Use:

- `src/lib/virtual-office/textMeetingRoom.ts`

Suggested target:

- `src/components/org/MobileExecutiveOfficeScene.tsx` for compact text room readiness labels.
- `src/components/org/OfficeControlModal.tsx` only if adding safe display-only meeting room copy.

Rules:

- Do not start live meetings.
- Do not add audio/video/WebRTC.
- Do not add realtime presence.
- Do not send external invites.
- Do not change database/API/Auth/RLS.
- Do not change `CHIP_POSITIONS`.
- Do not change `IMAGE_SRC`.
- Do not change `IMAGE_ASPECT_RATIO`.
- Do not change `rooms.map` ordering.
- Do not redesign OfficeControlModal.
- Do not use localStorage/sessionStorage.

Allowed:

- Display `غرفة نصية جاهزة`.
- Display blocked reasons for unassigned offices, employee role, empty team, or approval required.
- Keep all actions as safe text preparation only.

Validation:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run verify:isolation
```
