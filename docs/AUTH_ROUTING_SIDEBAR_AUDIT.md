# AUTH_ROUTING_SIDEBAR_AUDIT

## Scope
- Enforced landing/auth/app route separation.
- Preserved demo isolation.
- Updated real app sidebar visuals only.

## Changes
1. `/` remains marketing-only (no auth dependency).
2. `/auth` is the only real auth gateway and now redirects authenticated users to `/dashboard`.
3. `/dashboard` is protected through middleware and client auth guard; real content resolves to the existing real dashboard flow (`/clients`).
4. Real sidebar "الرئيسية" now points to `/dashboard` (not `/`).
5. Real sidebar visual style updated to dark glassmorphism aligned with demo spirit, with RTL-safe right-side icons, active glow, bottom user card, and mobile drawer.
6. `/demo` untouched and isolated.

## QA Checklist
- [x] Guest opening `/` sees landing only.
- [x] Guest opening `/dashboard` is redirected to `/auth?redirect=/dashboard`.
- [x] Authenticated user opening `/auth` is redirected to `/dashboard`.
- [x] In-app "الرئيسية" opens `/dashboard` then real dashboard flow.
- [x] `/demo` remains functional and unchanged.
