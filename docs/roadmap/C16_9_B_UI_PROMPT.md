# C16.9-B UI Prompt

Implement C16.9-B — Surface owner governance and package customization in the safe UI.

Use:

- `src/lib/virtual-office/ownerGovernancePolicy.ts`

Targets:

- `src/components/org/MobileExecutiveOfficeScene.tsx` only for compact accessibility text or small governance chip.
- `src/components/org/OfficeControlModal.tsx` only if adding safe copy to existing owner-facing surfaces.

Rules:

- Do not add billing logic.
- Do not change database/API/Auth/RLS.
- Do not fake package data.
- Do not change map image, aspect ratio, or coordinates.
- Do not change CHIP_POSITIONS.
- Do not redesign OfficeControlModal.
- Do not add realtime/audio/video/WebRTC.
- Do not use localStorage/sessionStorage.

Scope:

- Use deterministic defaults only.
- Show safe copy such as `حوكمة المالك` or `تخصيص المنشأة`.
- Keep package controls display-only until backend support is scoped.

Validation:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run verify:isolation`
