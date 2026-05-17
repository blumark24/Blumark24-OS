# AUTH & Security File Audit

## Scope checked
- `src/contexts/AuthContext.tsx`
- `src/app/auth/page.tsx`
- `src/app/page.tsx`
- Protected routes + dashboard route presence
- `middleware.ts`
- Supabase env var usage
- Admin API protection

## Root cause (confirmed)
1. Login flow redirected authenticated users back to `/` from `AuthContext`.
2. `/` is now marketing landing page, not internal app surface.
3. Middleware also redirected authenticated visits of `/auth` to `/`.

## Fix applied (minimal scope)
- Set internal post-login home to `/clients` (existing protected internal route).
- Keep `/` as marketing landing, `/demo` as demo, `/auth` for auth form.
- Added safe redirect sanitizer (allow only internal non-public paths).
- Added refresh-token failure handling: when `getSession` fails with refresh token error, clear local auth marker and sign out safely so UI never stays blocked.

## Route/guard observations
- There is no `src/app/dashboard/page.tsx` route currently.
- Protected app pages are at `/clients`, `/employees`, `/tasks`, `/finance`, `/reports`, `/automation`, `/settings`, etc.
- Middleware protects configured private paths and allows `/`, `/demo`, `/auth/*`.

## Security checks summary
- **No service role key on client**: client uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` only.
- **Service role key server-only**: admin routes read `SUPABASE_SERVICE_ROLE_KEY` in server handlers.
- **Admin APIs protected**: require bearer token + super admin verification.
- **Redirects now safer**: login redirect query must be an internal safe route and cannot target public pages.
- **Secrets in repo**: no hardcoded Supabase secrets found in source; only `.env.local.example` placeholders.
- **Mock/demo data**: demo data is isolated under demo components/data paths.

## Notes
- This patch intentionally avoids design edits and avoids business-logic changes outside auth redirect/session handling.
