# C18.1 — Safe Motion and Effects

## Status

Virtual Command Office surface: **10/10**.

C18.1 starts activation of safe motion and visual effects after the C17 validation and activation plan.

## Goal

Enable a controlled foundation for motion/effects without changing office coordinates, map rendering, data scope, or accessibility behavior.

## Added foundation

- `src/lib/virtual-office/safeMotionEffects.ts`
- `src/lib/virtual-office/__tests__/safeMotionEffects.acceptance.ts`

## Safety rules

Allowed:

- Hover polish.
- Focus polish.
- Lightweight glow.
- Short transitions.
- Reduced-motion support.

Blocked:

- Any transform that changes chip coordinates.
- Heavy effects before mobile performance validation.
- Map movement.
- Office hotspot drift.
- Effects that hide or cover the office chips.

## Activation rule

Do not wire this into the UI until these checks pass:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run verify:isolation
```

## Next

C18.1-B can wire the safe effect output into `MobileExecutiveOfficeScene.tsx` while keeping:

- `CHIP_POSITIONS` unchanged.
- `IMAGE_SRC` unchanged.
- `IMAGE_ASPECT_RATIO` unchanged.
- `rooms.map` unchanged.
- no realtime/audio/video/WebRTC.
