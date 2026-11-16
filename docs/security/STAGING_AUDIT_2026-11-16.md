# A++++ Staging Security Audit — Read-only Evidence (2026-11-16)

**Target:** BLUMARK24 OS SaaS; GitHub baseline `main@3e4ffce7144f53490be6e06a07cd2abb97336625`.  
**Review branch:** `audit/security-release-gate-20261116` (PR #545).  
**Mode:** Read-only inspection of project metadata, sanitized environment-variable **names**, repository source, and an isolated offline static preflight.  
**Not authorized/performed:** production or CORE changes; Supabase schema/RLS/Auth mutations; deployment/merge; user creation; credentials disclosure; customer reads; staging tenant creation; payment requests; live pentesting.

## Executive result

**Decision: HOLD**. The live Staging test environment could not be safely established. The designated `blumark24-os-staging` database was reported `INACTIVE`. The separate `blumark24-os-sec1a-preview` project had `ACTIVE_HEALTHY` *metadata* but its security-advisor call reported hibernation and its table, policy, function, and migration reads failed with connection timeouts. These are access blockers, not penetration-test failures. **Stop rather than switch to a possibly production database.** We did not run live cross-tenant tests.

The audit recorded **13 BLOCKED** items in [staging-evidence-2026-11-16.json](staging-evidence-2026-11-16.json), while the remaining 22 remain `NOT_TESTED`. No release-gate item is marked PASS or FAIL. Evidence verification coverage remains 0/35; this means no validated end-to-end security evidence, **not** that all 35 security controls are absent.

## Environment identity and safe access checks

| Check | Observed result | Scope / qualification |
|---|---|---|
| Supabase project inventory | Named staging project `INACTIVE` | No DB test attempted on that inactive target |
| Preview DB inventory | Named sec1a-preview project metadata `ACTIVE_HEALTHY` | Database operations returned hibernation/connection timeout |
| Preview DB metadata query | RLS table summary, policy counts, privileged-function grants and migration list **not obtained** | Query requests were SELECT/introspection only; **none completed** |
| Preview deployment | Vercel build for branch `audit/security-release-gate-20261116` reported `READY` | Build readiness only; **no authenticated smoke/UAT** |
| Vercel environment variable presence | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` names shown for app | No values, keys or tokens were accessed or saved; exact Supabase project backing preview remains unconfirmed |
| AI provider mismatch risk | Inspected route reads `ANTHROPIC_API_KEY`; absent from returned Vercel variable-name inventory | Provider may be configured elsewhere; runtime failure not proven |
| Scheduled automation configuration | Cron route checks `CRON_SECRET`; this variable absent from returned inventory; inspected `vercel.json` defines no `crons` | A separate scheduler may exist; not established |
| Production / CORE | No changes | No launch, merge, migrations or secret rotation initiated |

Preview deployment does **not** prove that a separate staging database is connected. We intentionally avoided testing against the production-labeled deployment or any ambiguous environment.

## Executed code-level static preflight

A reproducible read-only script was added at [staging-static-preflight.mjs](../../scripts/security/staging-static-preflight.mjs). Its exported `assessSource` function was syntax-compiled and invoked in an isolated JS test harness against the exact GitHub source strings at the inspected main commit.

| ID | Outcome | Evidence / interpretation |
|---|---|---|
| STATIC-01 | CODE_GUARD_PRESENT | `tenantUserAdmin.ts` contains `BLOCKED_TARGET_ROLES` and `TENANT_ASSIGNABLE_ROLES`. Does not prove live provisioning security |
| STATIC-02 | CODE_GUARD_PRESENT | `run-scheduled/route.ts` checks missing/incorrect Cron secret before work. Does not prove scheduling or env setup |
| STATIC-03 | REVIEW_REQUIRED | `PermissionsContext.tsx` maps legacy `general_manager` / `مدير_عام` to `super_admin`; check whether storage and owner API deny inappropriate privilege expansion |
| STATIC-04 | REVIEW_REQUIRED | Existing `verify-tenant-isolation.mjs` reads with service role and prints **manual** Org A/B checklist, not real two-session denied read/write assertions |
| STATIC-05 | REVIEW_REQUIRED | `src/lib/security/rateLimit.ts` defines `ALLOW_ON_ERROR` with `allowed: true`; review the failure policy for sensitive routes |
| STATIC-06 | CODE_DEPENDENCY_PRESENT | AI chat route reads `ANTHROPIC_API_KEY`; production/preview provider readiness unverified |

These six **static observations are not six passing security checks**. Two are presence-only guards; three require human review and staging tests; one is a configuration dependency. Neither source inspection nor the JavaScript harness tests authentication across live tenants.

### Source pointers

- [PermissionsContext — aliases](https://github.com/blumark24/Blumark24-OS/blob/3e4ffce7144f53490be6e06a07cd2abb97336625/src/contexts/PermissionsContext.tsx)
- [Tenant user provisioning](https://github.com/blumark24/Blumark24-OS/blob/3e4ffce7144f53490be6e06a07cd2abb97336625/src/lib/api/tenantUserAdmin.ts)
- [Cron runner](https://github.com/blumark24/Blumark24-OS/blob/3e4ffce7144f53490be6e06a07cd2abb97336625/src/app/api/automation/run-scheduled/route.ts)
- [Rate limiter](https://github.com/blumark24/Blumark24-OS/blob/3e4ffce7144f53490be6e06a07cd2abb97336625/src/lib/security/rateLimit.ts)
- [Static isolation verifier](https://github.com/blumark24/Blumark24-OS/blob/3e4ffce7144f53490be6e06a07cd2abb97336625/scripts/verify-tenant-isolation.mjs)
- [AI chat](https://github.com/blumark24/Blumark24-OS/blob/3e4ffce7144f53490be6e06a07cd2abb97336625/src/app/api/ai/chat/route.ts)
- [Vercel settings file](https://github.com/blumark24/Blumark24-OS/blob/3e4ffce7144f53490be6e06a07cd2abb97336625/vercel.json)
- [PR #545](https://github.com/blumark24/Blumark24-OS/pull/545)

## Why the live security checks remain blocked

The active `SECURITY DEFINER` and RLS policy statuses of the intended staging DB were **not retrieved**. We must not substitute results from the separately named Supabase project or from old production security audits. Likewise, use of a privileged service-role read is not a valid substitute for RLS tests performed as two different authenticated, nonprivileged tenant users.

No two signed-in test accounts, seeded cross-tenant sentinel records, or verified Staging deployment-to-database mapping was established. Therefore S01 (live isolation), S02 (role escalation), S03 (privileged APIs/RPC), V03 (DB), V09 (admin access) and related tests remain blocked. The attached evidence JSON lists all 13 blocked tests and reasons.

## Gate-ready plan with exact acceptance conditions

1. **Restore/identify the isolated staging backend**, verify its relation to preview deployment using only nonsecret configuration metadata. Confirm it has no customer production data and no live write links to production.
2. **Create strictly synthetic Org A and Org B fixtures in that isolated staging environment** as a separately approved test-data exercise; use role-scoped nonprivileged tokens (no service_role as tester).
3. **Negative isolation assertions:** each tenant can read/update its own seeded record, cannot read or update the other tenant's known record ID; test clients, tasks, employees, transactions, file storage, notifications and sensitive APIs. Capture sanitized HTTP statuses and row counts, not personal data.
4. **RBAC matrix:** run owner, tenant manager, finance manager, employee and legacy alias negative tests; independently check RLS vs UI role handling and definer RPC grants. No unauthorized mutation is permitted.
5. **Operational evidence:** validate CRON_SECRET and actual schedule without revealing values; test AI provider in preview; sandbox billing and webhook signatures; isolated restore drill and alert delivery.
6. **Review:** ORION checks each timestamped result against the exact revision and environment; human owner approves any P0 fix, merge, release or production change separately.

**Go/No-Go:** HOLD remains in effect. No fix was applied to Auth/RLS, no environment was woken intentionally, and no data/security operations were issued to any confirmed production or CORE resource.
