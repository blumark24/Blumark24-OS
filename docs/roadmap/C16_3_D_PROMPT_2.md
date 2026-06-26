# C16.3-D Safe UI Prompt

Apply the motion adapter to existing Virtual Office interaction points only.

Use:

- `src/lib/virtual-office/useVirtualOfficeMotion.ts`

Target:

- `src/components/org/VirtualOfficeDesign.tsx`

Rules:

- Keep the 9-office map unchanged.
- Keep office coordinates unchanged.
- Keep OfficeControlModal design unchanged.
- Keep FullscreenOfficeExperience unchanged.
- Keep sidebar and header unchanged.
- Keep C16.2-I scoped data logic unchanged.
- Do not add audio, video, realtime, meetings, or fake presence.

Validation:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run verify:isolation`
