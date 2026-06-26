# C16.7-B UI Prompt

Implement C16.7-B — Surface office file/report readiness in the safe UI.

Use:

- `src/lib/virtual-office/officeArtifactSummary.ts`

Targets:

- `src/components/org/MobileExecutiveOfficeScene.tsx` only for compact accessibility labels or tiny readiness chips.
- `src/components/org/OfficeControlModal.tsx` only if adding safe readiness copy to existing Files/Report tabs.

Rules:

- Do not create files.
- Do not fake files.
- Do not generate exports.
- Do not add database/API/Auth/RLS changes.
- Do not change map image, aspect ratio, or coordinates.
- Do not change CHIP_POSITIONS.
- Do not redesign OfficeControlModal.
- Do not add audio/video/WebRTC/realtime.
- Do not use localStorage/sessionStorage.

Scope:

- Use scoped room summary values only.
- Show safe readiness states such as `مساحة ملفات جاهزة` and `تقرير المكتب`.
- Keep export as `قريباً` until a later export phase.

Validation:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run verify:isolation`
