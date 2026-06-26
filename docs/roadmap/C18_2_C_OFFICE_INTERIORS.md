# C18.2-C — Office Interiors Foundation

## Purpose

Do not lose the internal-office requirement.

Each external office on the 9-office map must be able to open a matching internal office view later, while preserving the same office number and organizational link.

## Required mapping

| External office | Internal view |
|---|---|
| OFFICE 01 | `office-01-interior` |
| OFFICE 02 | `office-02-interior` |
| OFFICE 03 | `office-03-interior` |
| OFFICE 04 | `office-04-interior` |
| OFFICE 05 | `office-05-interior` / Boardroom |
| OFFICE 06 | `office-06-interior` |
| OFFICE 07 | `office-07-interior` |
| OFFICE 08 | `office-08-interior` |
| OFFICE 09 | `office-09-interior` |

## Added foundation

- `src/lib/virtual-office/officeInteriorProfile.ts`
- `src/lib/virtual-office/__tests__/officeInteriorProfile.acceptance.ts`

## Rules

- The internal office must preserve the same external office number.
- OFFICE 05 remains the boardroom / مجلس الإدارة.
- Unassigned offices must not open an internal view until linked from the organization structure.
- If the internal image/asset is not ready, show pending asset state instead of fake interior.
- No fake office interior images.
- No map coordinate changes.
- No `CHIP_POSITIONS` changes.
- No `rooms.map` ordering changes.
- No realtime/audio/video/WebRTC.

## Next

C18.2-D can surface internal-office readiness on the existing office chip or control modal as display-only.

C18.3 can later add real internal office screens after approved visual assets exist for all 9 offices.
