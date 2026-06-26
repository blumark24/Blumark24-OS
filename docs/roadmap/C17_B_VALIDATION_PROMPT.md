# C17-B Validation Prompt

Implement C17-B — Surface production readiness in a safe owner/admin surface.

Use:

- `src/lib/virtual-office/productionReadinessPolicy.ts`

Rules:

- Do not claim production is fully ready unless all readiness gates pass.
- Do not add realtime/audio/video/WebRTC.
- Do not change map image, aspect ratio, or coordinates.
- Do not change CHIP_POSITIONS.
- Do not redesign OfficeControlModal.
- Do not add database/API/Auth/RLS changes in this step.
- Do not use localStorage/sessionStorage.

Scope:

- Show readiness status as display-only.
- Show failed/warning gates clearly.
- Keep 1000-client readiness as a validation target, not a marketing claim.

Validation:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run verify:isolation`
