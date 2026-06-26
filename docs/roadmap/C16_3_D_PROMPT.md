# C16.3-D Prompt

Implement the next UI step after reviewing C16.3-C.

Use `src/lib/virtual-office/useVirtualOfficeMotion.ts` in `src/components/org/VirtualOfficeDesign.tsx`.

Rules:

- Keep the 9-office map unchanged.
- Keep office coordinates unchanged.
- Keep OfficeControlModal design unchanged.
- Keep FullscreenOfficeExperience unchanged.
- Keep sidebar/header/global layout unchanged.
- Keep C16.2-I scoped data logic unchanged.
- Do not add audio, video, realtime, or meetings.
- Do not add fake presence.
- Do not add browser storage.

Scope:

- Apply `useVirtualOfficeMotionStyle()` only to existing clickable office interaction elements.
- Merge motion style values without changing existing layout styles.
- Keep disabled states disabled.
- Respect reduced motion.

Validation:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run verify:isolation`
