# C18.2-D UI Prompt

Implement C18.2-D — Surface internal-office readiness without opening fake interiors.

Use:

- `src/lib/virtual-office/officeInteriorProfile.ts`

Targets:

- `src/components/org/MobileExecutiveOfficeScene.tsx` for a compact readiness label.
- `src/components/org/OfficeControlModal.tsx` only for display-only internal-office status.

Rules:

- Do not generate fake interior images.
- Do not add unapproved interior assets.
- Do not change `CHIP_POSITIONS`.
- Do not change `IMAGE_SRC`.
- Do not change `IMAGE_ASPECT_RATIO`.
- Do not change `rooms.map` ordering.
- Do not redesign OfficeControlModal.
- Do not add database/API/Auth/RLS changes.
- Do not activate realtime/audio/video/WebRTC.
- Do not use localStorage/sessionStorage.

Allowed:

- Show `المكتب الداخلي جاهز` only when an approved interior asset exists.
- Show `تجهيز الصورة الداخلية` when the office has no approved interior asset yet.
- Keep OFFICE 05 as `غرفة مجلس الإدارة الداخلية`.
- Keep unassigned offices locked until linked from the organization structure.

Validation:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run verify:isolation
```
