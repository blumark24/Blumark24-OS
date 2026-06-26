# C19.1-D Implementation Prompt — Presence Consent and Privacy

Implement the presence consent/privacy layer only.

## Allowed

- Add consent policy helpers.
- Add disabled consent preview UI.
- Add tests and documentation.

## Forbidden

- Do not enable realtime.
- Do not show online status.
- Do not add Supabase channel code.
- Do not add database writes.
- Do not change API/Auth/RLS.
- Do not add audio/video/WebRTC.
- Do not add message sending.
- Do not replace images.
- Do not move the map.
- Do not change coordinates.
- Do not change `CHIP_POSITIONS`.
- Do not change `rooms.map` order.
- Do not use localStorage/sessionStorage.

## Required language

User-facing Arabic labels must clearly state:

```txt
غير مفعّل
عرض فقط
لا تتبع
لا صوت ولا فيديو
```
