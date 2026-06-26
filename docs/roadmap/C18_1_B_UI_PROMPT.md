# C18.1-B UI Prompt

Implement C18.1-B — Wire safe motion effects into the Virtual Command Office UI.

Use:

- `src/lib/virtual-office/safeMotionEffects.ts`

Target:

- `src/components/org/MobileExecutiveOfficeScene.tsx`

Rules:

- Do not change `CHIP_POSITIONS`.
- Do not change `IMAGE_SRC`.
- Do not change `IMAGE_ASPECT_RATIO`.
- Do not change `rooms.map` ordering.
- Do not animate chip coordinate transforms.
- Do not move the map.
- Do not add heavy effects.
- Do not add realtime/audio/video/WebRTC.
- Do not use localStorage/sessionStorage.

Allowed:

- Add a safe effect token.
- Use glow opacity and duration values.
- Keep transform locked to `translate(-50%, -50%)`.
- Respect reduced motion.

Validation:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run verify:isolation
```
