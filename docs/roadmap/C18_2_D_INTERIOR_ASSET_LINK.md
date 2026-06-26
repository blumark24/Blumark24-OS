# C18.2-D — Link Existing Office Interior Assets

## Decision

Use the existing office interior image as-is.

No replacement. No deletion. No generated substitute.

## Existing asset

```txt
public/virtual-office/interiors/blumark-office-portal-interior.svg
```

## Implementation

- Register the existing asset in `officeInteriorProfile.ts`.
- Map OFFICE 01–09 to the existing approved interior asset for the first safe activation.
- Use the interior asset inside `FullscreenOfficeExperience.tsx`.
- Keep the external office map crop as a fallback layer.

## Safety preserved

- No external map image replacement.
- No interior image replacement.
- No fake image generation.
- No coordinate changes.
- No `CHIP_POSITIONS` changes.
- No `IMAGE_SRC` changes in `MobileExecutiveOfficeScene.tsx`.
- No `rooms.map` order changes.
- No database/API/Auth/RLS changes.
- No realtime/audio/video/WebRTC.
- No localStorage/sessionStorage.

## Product behavior

Clicking `دخول المكتب` opens the internal office portal using the existing saved image.

If a future office-specific interior image is approved, it can replace only that office interior registry entry without touching the external 9-office map.
