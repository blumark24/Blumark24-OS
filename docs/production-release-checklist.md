# C11-E Production Release Checklist

This checklist is for controlled Blumark24 OS production releases. It is intentionally operational and does not include secret values.

## Pre-Release Checklist

- Confirm the release branch is based on the latest `main`.
- Confirm all C11-A through C11-D changes are merged.
- Confirm the PR contains no changes to forbidden areas:
  - `src/app/ai/**`
  - `src/app/owner/security/**`
  - `src/app/dashboard/executive-blue-preview/**`
  - `src/app/dashboard/neon-intelligence-preview/**`
  - Supabase migrations
  - payment gateway files
  - UI redesign files
- Run:
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `.\node_modules\.bin\tsc.cmd --noEmit`
- Optional security check:
  - `npm.cmd run audit:prod -- --audit-level=high`
- Review `docs/public-route-review.md` for route exposure expectations.
- Review `docs/security-readiness-audit.md` for remaining release risks.

## Environment Checklist

Required core runtime:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Required operations:

- `CRON_SECRET`

Recommended deployment metadata:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_VERSION`
- `NEXT_PUBLIC_COMMIT_SHA`
- `VERCEL_ENV`
- `VERCEL_GIT_COMMIT_SHA`

Owner/admin configuration observed in code:

- `PLATFORM_ADMIN_EMAILS`

AI-related variables observed in code, only for approved AI phases:

- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Validation rule: check presence only. Never paste values in PRs, issue comments, logs, screenshots, or runbooks.

## Security Checklist

- Confirm no service-role key is used in client components.
- Confirm service-role usage remains server-only and route-scoped.
- Confirm auth and RLS policies were not changed in this release.
- Confirm tenant-scoped routes use authenticated Supabase clients or explicit tenant checks.
- Confirm cron route rejects requests without `CRON_SECRET`.
- Confirm health endpoint returns booleans only for environment presence.
- Confirm rate-limited routes still return safe payloads.
- Confirm logs do not include bearer tokens, service-role keys, passwords, or full sensitive PII.
- Confirm no new localStorage usage was added.
- Confirm no fake data or fake metrics were added.

## Smoke Test Checklist

- Login as a customer.
- Open `/dashboard`.
- Open `/clients`.
- Open `/tasks`.
- Open `/finance`.
- Open `/employees`.
- Open `/reports`.
- Open `/settings`.
- Login as owner if available and open `/owner`.
- Test create client login against a test tenant only.
- Test reset client password against a test tenant only.
- Call `/api/health`; expected `status: ok` or a clear degraded reason.
- Call `/api/health?deep=1`; expected safe deep health payload with no secrets.
- Call `/api/automation/run-scheduled` without authorization; expected `401`.
- Confirm `/api/tenant/dashboard-summary` works only with a valid authenticated session.

## Rollback Checklist

- Identify the last known-good production deployment in Vercel.
- Promote or redeploy the last known-good deployment.
- Confirm `/api/health` after rollback.
- Confirm `/dashboard` after rollback.
- Pause scheduled automation if the incident involves cron writes.
- Do not perform manual database changes unless separately approved.
- Record request ids, deployment id, time window, affected routes, and customer impact.

## Post-Release Monitoring Checklist

- Watch Vercel runtime logs for elevated 4xx/5xx rates.
- Watch function duration and memory for `/api/tenant/dashboard-summary`, owner service-role routes, and cron.
- Watch Supabase API logs, Auth logs, database connections, and slow query indicators.
- Review rate-limit denials for unexpected customer impact.
- Confirm cron runs do not overlap or produce repeated failures.
- Confirm `/api/health` remains stable from an external uptime monitor.
- Review error reports in `system_errors` if available.

## Known Limitations

- Real payment gateway and webhook processing are not implemented in this phase.
- Distributed rate limiting depends on the existing Supabase-backed limiter availability; fallback behavior may be less strict.
- Health deep check uses a minimal service-role `head` query and should remain operational-only.
- Full load testing for 1000 customers is a later phase.
- Package upgrades are not performed in C11-E.

## Go / No-Go Criteria

Go:

- Build, lint, and TypeScript checks pass.
- No forbidden paths changed.
- No migrations or auth/RLS changes were added.
- `/api/health` returns a safe payload.
- Smoke tests pass on production or preview.
- Rollback target is known.

No-Go:

- Any secret appears in logs, endpoint output, docs, or PR comments.
- Any unexpected auth/RLS change is present.
- Any migration appears without explicit approval.
- Core login, dashboard, clients, tasks, finance, or owner smoke tests fail.
- Health deep check reports unresolved Supabase connectivity failure in production.
