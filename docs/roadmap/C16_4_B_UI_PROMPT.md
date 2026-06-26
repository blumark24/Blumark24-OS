# C16.4-B UI Prompt

Implement C16.4-B — Wire smart suggestions into VirtualOfficeDesign.

Use:

- `src/lib/virtual-office/officeSmartSuggestions.ts`

Target:

- `src/components/org/VirtualOfficeDesign.tsx`

Rules:

- Use scoped summary values only.
- Do not change the 9-office map.
- Do not change office coordinates.
- Do not redesign OfficeControlModal.
- Do not change FullscreenOfficeExperience.
- Do not change sidebar/header/global layout.
- Do not add external AI calls.
- Do not add fake data.
- Do not add meetings, realtime, audio, video, or WebRTC.
- Do not add localStorage/sessionStorage.

Scope:

- Build one suggestion per office using `firstOfficeSmartSuggestion`.
- Show suggestion text only in existing safe summary areas.
- Keep unassigned offices as `جاهز بعد الربط`.
- Keep OFFICE 05 board behavior restricted to owner/board summary rules.

Validation:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run verify:isolation`
