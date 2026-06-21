# Public Route Review

This review classifies routes discovered from `src/app` during C11-E. It is documentation only and does not change behavior.

## Classification Legend

- Public: accessible without an authenticated app session.
- Authenticated: requires a valid Supabase session or tenant context.
- Owner/Admin: requires platform owner, admin, or privileged role checks.
- Cron/Internal: intended for scheduled or server-to-server execution.
- Health/Ops: operational diagnostics.

## Page Routes

| Route | Classification | Notes | Recommended Protection |
| --- | --- | --- | --- |
| `/` | Public | Marketing/landing entry. | Keep static and avoid sensitive data. |
| `/auth` | Public | Login page. | Monitor auth errors and abuse. |
| `/auth/reset-password` | Public | Password reset completion page. | Keep token handling client/Supabase controlled. |
| `/admin-recovery` | Owner/Admin | Recovery-oriented page. | Keep owner gating and audit use. |
| `/dashboard` | Authenticated | Customer dashboard. | Keep tenant-scoped summary read model. |
| `/clients` | Authenticated | Customer data. | Keep pagination and tenant isolation. |
| `/tasks` | Authenticated | Customer task data. | Keep bounded reads. |
| `/finance` | Authenticated | Customer financial records. | Keep tenant isolation and avoid fake metrics. |
| `/employees` | Authenticated | Employee records. | Avoid exposing cross-tenant data. |
| `/reports` | Authenticated | Reports preview/data. | Keep bounded data and honest empty states. |
| `/settings` | Authenticated | Customer settings. | Avoid leaking org identifiers across tenants. |
| `/profile` | Authenticated | User profile. | Keep self-update scoped. |
| `/automation` | Authenticated | Automation UI. | Keep tenant-scoped visibility. |
| `/org` | Authenticated | Organization page. | Verify tenant membership. |
| `/strategy` | Authenticated | Customer workspace page. | Keep customer data scoped. |
| `/virtual-office` | Authenticated | Customer workspace page. | Avoid heavy realtime pressure. |
| `/demo` | Public | Demo page. | Ensure no real customer data appears. |
| `/ai` | Authenticated/Feature | Forbidden for C11-E changes. | Leave untouched; review in AI-specific phase. |
| `/owner` | Owner/Admin | Owner command center. | Keep owner allowlist and role checks. |
| `/owner/login` | Public | Owner login entry. | Monitor failed logins. |
| `/owner/organizations` | Owner/Admin | Customer management. | Keep owner gating. |
| `/owner/organizations/[id]` | Owner/Admin | Organization detail. | Keep owner gating. |
| `/owner/plans` | Owner/Admin | Plan management. | Do not add payment gateway here. |
| `/owner/subscriptions` | Owner/Admin | Subscription management. | Keep billing foundation only. |
| `/owner/billing` | Owner/Admin | Billing view. | No real payment gateway in this phase. |
| `/owner/invoices` | Owner/Admin | Invoice view. | Avoid exposing payment secrets. |
| `/owner/usage` | Owner/Admin | Usage visibility. | Keep aggregate/owner-scoped data. |
| `/owner/ai-usage` | Owner/Admin | AI usage visibility. | Do not touch AI logic in this phase. |
| `/owner/whatsapp` | Owner/Admin | Integration view. | Keep credentials server-side. |
| `/owner/roles` | Owner/Admin | Role view. | Do not change auth/RLS here. |
| `/owner/settings` | Owner/Admin | Owner settings. | Keep owner-only. |
| `/owner/security` | Owner/Admin | Audit center. | Forbidden for C11-E changes. |

## API Routes

| Route | Classification | Notes | Recommended Protection |
| --- | --- | --- | --- |
| `/api/health` | Health/Ops | Public safe health payload, deep mode rate-limited. | Keep boolean env presence only; no secrets. |
| `/api/automation/run-scheduled` | Cron/Internal | Requires `CRON_SECRET`. | Keep request id, rate limit, bounded batches. |
| `/api/tenant/dashboard-summary` | Authenticated | Tenant dashboard summary. | Keep authenticated bearer flow and bounded read model. |
| `/api/tenant/workspace-context` | Authenticated | Tenant workspace context. | Keep server-side tenant checks. |
| `/api/tenant/executive-office/room-mappings` | Authenticated | Tenant mapping data. | Keep tenant isolation. |
| `/api/tenant/ai-context` | Authenticated/Feature | AI-adjacent context. | Review in AI-specific phase; no C11-E changes. |
| `/api/tenant/ai-assistant` | Authenticated/Feature | AI assistant route. | Review in AI-specific phase; no C11-E changes. |
| `/api/ai/chat` | Authenticated/Feature | AI route. | Forbidden for C11-E changes. |
| `/api/chat` | Public/Feature | Gemini-backed chat route if key is present. | Recommend auth/rate-limit review before production exposure. |
| `/api/admin/create-user` | Owner/Admin | Creates auth/profile/employee records. | Keep authorization, rate limit, and production-safe errors. |
| `/api/admin/update-user` | Owner/Admin | Updates user records. | Keep authorization and production-safe errors. |
| `/api/admin/delete-user` | Owner/Admin | Deletes user records. | Keep authorization and audit expectations. |
| `/api/owner/provision-tenant` | Owner/Admin | Service-role tenant provisioning. | Keep owner verification and rate limits. |
| `/api/owner/change-organization-plan` | Owner/Admin | Plan changes. | Keep audit logging and no payment gateway behavior. |
| `/api/owner/create-client-login` | Owner/Admin | Creates customer manager login. | Keep owner verification, password guard, and rate limit. |
| `/api/owner/reset-client-password` | Owner/Admin | Sends reset flow. | Never generate or log passwords. |
| `/api/auth/check-password` | Public/Auth-adjacent | Password validation helper. | Keep rate limit and no password logging. |
| `/api/auth/clear-force-pw` | Authenticated | Clears caller password-change flag. | Keep bearer verification and service-role server-only use. |
| `/api/profile/update-self` | Authenticated | Self profile update. | Keep self-scope and validation. |
| `/api/analytics/feature-usage` | Authenticated | Usage tracking. | Keep bounded metadata and no PII. |
| `/api/monitoring/error` | Authenticated/Ops | Client-side error reporting. | Keep strict source whitelist and metadata limits. |

## Key Risks

- Public or feature routes should not expose provider errors, API keys, or customer data.
- Service-role routes must remain server-only and require explicit caller verification.
- Owner/admin pages depend on UI gating plus server route authorization; both must stay intact.
- Deep health should be used by operational monitors, not as a customer-facing diagnostics page.

## Recommended Follow-Up

- Add automated route inventory generation in a future release.
- Add production uptime monitoring for `/api/health`.
- Review `/api/chat` and all AI-adjacent routes in a dedicated AI production hardening phase.
- Add CI checks for forbidden path changes on security-scoped PRs.
