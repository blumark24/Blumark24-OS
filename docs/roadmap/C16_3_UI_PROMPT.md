# C16.3-C UI Prompt

```txt
Implement C16.3-C — Consume safe motion tokens in VirtualOfficeDesign.

Use:
src/lib/virtual-office/interactionMotion.ts

Target:
src/components/org/VirtualOfficeDesign.tsx

Rules:
- Do not change the 9-office map.
- Do not change office coordinates.
- Do not redesign OfficeControlModal.
- Do not change sidebar/header/global layout.
- Do not add WebRTC/audio/video/realtime.
- Do not add fake presence.
- Do not add localStorage/sessionStorage.
- Keep C16.2-I scoped data logic untouched.

Scope:
- Add safe hover/focus transitions using getVirtualOfficeMotionToken.
- Respect reduced motion.
- Keep disabled actions visibly disabled.
- No feature activation for meetings or live presence.

Validation:
- npx tsc --noEmit
- npm run lint
- npm run build
- npm run verify:isolation
```
