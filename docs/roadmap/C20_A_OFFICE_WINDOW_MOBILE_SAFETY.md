# C20-A — Office Window Mobile Safety

## Goal

Harden the internal office window on mobile without changing the external office map, office coordinates, images, or meeting/presence behavior.

## What changed

Only `src/app/globals.css` receives scoped CSS overrides for the internal office window classes:

- `.bm-office-portal-shell`
- `.bm-office-portal-main`
- `.bm-office-crop-frame`
- `.bm-office-command-panel`
- `.bm-office-persona-stage`

## Mobile behavior

- The internal office window keeps a stable viewport height.
- Long content scrolls inside the command panel instead of pushing the whole page.
- The panel uses native smooth touch scrolling on iOS.
- The persona chips stay inside the office window and can scroll horizontally if needed.
- Mobile keeps the text room, presence gate, personas, members, and note visible inside the panel.
- Very small phones receive a slightly taller panel and simpler requirement layout.

## Safety preserved

- No external map change.
- No office coordinate change.
- No `CHIP_POSITIONS` change.
- No `rooms.map` order change.
- No `MobileExecutiveOfficeScene.tsx` change.
- No `FullscreenOfficeExperience.tsx` logic change.
- No image replacement.
- No new generated/fake image.
- No API/Auth/RLS change.
- No database write.
- No realtime.
- No online status.
- No audio/video/WebRTC.
- No microphone/camera/screen permission request.
- No localStorage/sessionStorage.

## Audit notes

The CSS is scoped to internal office window classes. It does not touch global dashboard cards, the sidebar, the landing page, or the external office scene.

## Next

C20-B can add a dedicated visual QA checklist for:

- iPhone small viewport.
- iPhone large viewport.
- Android small viewport.
- Tablet portrait.
- Tablet landscape.
