# C22-B — Smart Office Windows Core

## Scope

C22-B stabilizes the office control windows only. It does not change the map, office coordinates, images, tenant data, Supabase, authentication, realtime, audio, or video.

## Product goal

Make every office window feel like a premium enterprise SaaS smart modal:

- clear header
- clear privacy/mode lane
- horizontally scrollable tabs
- body-only vertical scrolling
- stable footer
- smart assignment panel inside the window
- safe iPhone 15 Pro Max behavior
- reduced-motion support

## Protected design rules

- Preserve the approved dark navy / electric cyan / purple glassmorphism identity.
- Do not redesign the footer or header.
- Do not create a full-screen mobile modal unless explicitly approved.
- Do not add fake data.
- Do not imply hidden monitoring.
- Keep Office 05 as مجلس الإدارة / مركز التحكم التشغيلي للمنشأة.

## Smart Assignment Panel rules

The assignment panel must behave as a small smart window inside the office modal:

1. Closed state stays compact.
2. Open state has a bounded height.
3. Filter chips stay reachable.
4. Unit list scrolls internally.
5. Selected unit stays visually clear.
6. Confirmation button stays inside the panel.
7. The external footer never covers the confirmation button.
8. The body scroll and panel scroll do not fight each other.

## Mobile checklist

Test on iPhone 15 Pro Max:

- Open OFFICE 01.
- Open OFFICE 07 / unassigned office.
- Open ربط المكتب وتشغيله.
- Switch: الكل / إدارة / قسم / فريق.
- Scroll the unit list inside the panel.
- Select a unit.
- Confirm button remains visible inside the panel.
- Tabs scroll horizontally without clipping.
- Privacy/mode bar does not overlap tabs.
- Footer remains visible and does not cover panel content.

## Desktop checklist

- Modal remains centered.
- Width remains close to the approved original window.
- Panel height stays bounded.
- Footer remains stable.
- Board room window remains visually premium.

## Non-goals

- No new internal office images.
- No meeting activation.
- No WebRTC.
- No DB or RLS changes.
- No tenant isolation changes.
- No map rendering changes.
