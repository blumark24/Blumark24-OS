# Stage 1B — Free Leaked Password Guard

## Why This Exists

Supabase's built-in "Leaked Password Protection" feature (which checks passwords against Have I Been Pwned at auth time) requires the Pro plan or higher. To maintain security without a paid plan, this stage adds an application-level compensating control that provides equivalent protection using the free HIBP k-anonymity range API.

## What Was Implemented

### Files Added

- **`src/lib/security/passwordGuard.ts`** — server-safe helper exporting:
  - `validatePasswordStrength(password)` — enforces all local strength rules
  - `checkPwnedPassword(password)` — k-anonymity HIBP check (never sends raw password)
  - `validatePasswordForAuth(password)` — combined strength + pwned check, fail-open on HIBP outage

- **`src/app/api/auth/check-password/route.ts`** — POST-only Node.js API route that validates a password and returns `{ ok, warning? }` or `{ ok: false, error }`.

### Files Modified

- **`src/app/api/owner/create-client-login/route.ts`** — replaced `passwordError()` with `validatePasswordForAuth()`. If HIBP was unavailable during creation, records `password_guard_warning: true` in `owner_audit_logs` metadata (no warning text stored, no password stored).

- **`src/app/auth/reset-password/page.tsx`** — before calling `supabase.auth.updateUser`, calls `POST /api/auth/check-password`. If `ok: false`, shows Arabic error and does not update. If `ok: true`, proceeds normally.

## Privacy Model

| What happens | Detail |
|---|---|
| Raw password | Never sent to HIBP or any external service |
| SHA-1 digest | Computed locally in Node.js using `crypto.createHash` |
| Sent to HIBP | Only the first 5 hex characters (prefix) of the SHA-1 digest |
| Suffix comparison | Done entirely in memory on the server |
| Logging | No passwords, hashes, prefixes, suffixes, or HIBP responses are logged |
| Storage | Nothing is stored |

The k-anonymity design means HIBP never learns which specific password was checked — only that *some* password whose SHA-1 starts with a given 5-character prefix was checked.

## Failure Modes

| Scenario | Behavior |
|---|---|
| HIBP request times out (>3 s) | Fail open — local strength rules enforced, warning flag in audit log |
| HIBP returns non-200 | Fail open — same as above |
| Network error / DNS failure | Fail open — same as above |
| Password is in HIBP database | Fail closed — user sees Arabic error, cannot proceed |
| Password fails strength rules | Fail closed — user sees Arabic error before HIBP is even called |

## Limitations

- Supabase Advisor may still report "Leaked Password Protection: disabled" because it refers to the Supabase built-in feature, not this application-level control.
- This check runs server-side through our API route; client-side password changes that bypass this route (e.g., direct SDK calls) will not benefit from the HIBP check (only the strength rules enforced on the client side apply).
- HIBP database is not exhaustive — very new leaked passwords may not appear yet.

## No SQL Applied

No Supabase migrations were applied. No database schema was changed. This is a pure application-layer control.

## Testing Commands

```bash
# Lint
npm run lint

# Build
npm run build

# Isolation verification
npm run verify:isolation
```

All three must pass with zero errors before commit.

## Manual QA Checklist

1. **Owner create client login rejects weak password**
   - Go to Owner panel → Organizations → select org → Set Login
   - Enter a weak password (e.g. `abc`)
   - Expect: Arabic error shown, no account created

2. **Owner create client login rejects known leaked password**
   - Enter `Password123!` (appears in HIBP millions of times)
   - Expect: Arabic error "كلمة المرور مستخدمة في تسريبات سابقة..."

3. **Reset password page rejects known leaked password**
   - Trigger a password reset email, open the link
   - Enter `Password123!` as the new password
   - Expect: Arabic error shown, `supabase.auth.updateUser` not called

4. **Strong unique password proceeds**
   - Enter a strong, unique password (e.g. randomly generated with upper/lower/number/symbol, 16+ chars)
   - Expect: password accepted and flow completes normally

5. **HIBP outage does not block operations**
   - If HIBP is unreachable, the password guard logs `password_guard_warning: true` in audit metadata
   - Local strength rules still apply (weak password still rejected)
   - A user with a strong password is NOT blocked by an HIBP outage

## Test Results (at commit time)

| Check | Result |
|---|---|
| `npm run lint` | ✓ No ESLint warnings or errors |
| `npm run build` | ✓ Build completed successfully |
| `npm run verify:isolation` | ✓ Verification passed |
