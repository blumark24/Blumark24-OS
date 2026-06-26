# C16.3-B Implementation Prompt

Use this after C16.3-A is merged.

```txt
Implement C16.3-B — Virtual Command Office micro-interactions.

Use:
src/lib/virtual-office/interactionReadiness.ts

Target file:
src/components/org/VirtualOfficeDesign.tsx

Rules:
- Do not change the 9-office map.
- Do not change office coordinates.
- Do not redesign OfficeControlModal.
- Do not change sidebar/header/global layout.
- Do not add WebRTC/audio/video/realtime.
- Do not add fake presence.
- Do not add localStorage/sessionStorage.

Scope:
- Use interactionReadiness to gate future actions.
- Keep meeting and live features disabled.
- Add only safe hover/focus/reduced-motion micro-interaction hooks if needed.
- Preserve scoped office data from C16.2-I.

Validation:
- npx tsc --noEmit
- npm run lint
- npm run build
- npm run verify:isolation
```
