# Blumark24 OS Production Runbook

This runbook is the operating checklist for production releases, incidents, and smoke tests. It intentionally lists environment variable names only. Never paste secrets, tokens, service-role keys, bearer tokens, customer data, or private URLs into tickets, logs, screenshots, or PRs.

## Deployment Checklist

1. Confirm the target branch is `main` and all required PR checks passed.
2. Confirm the release PR does not include migrations unless the migration was explicitly approved.
3. Confirm forbidden areas are untouched for the release scope:
   - `src/app/ai/**`
   - `src/app/owner/security/**`
   - dashboard visual preview routes unless the release is explicitly a preview release
   - payment gateway files unless the release is explicitly a billing integration
4. Review Vercel build output for TypeScript, lint, route generation, and font/network warnings.
5. Confirm `/api/health` returns `status: ok` after deployment.
6. Run the post-deploy smoke test checklist below.
7. Keep the previous deployment available for rollback until smoke tests pass.

## Environment Variables Checklist

Required for core runtime:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Required for scheduled automation:

- `CRON_SECRET`

Recommended deployment metadata:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_VERSION`
- `NEXT_PUBLIC_COMMIT_SHA`
- `VERCEL_ENV`
- `VERCEL_GIT_COMMIT_SHA`

AI-related variables, if AI routes are enabled in a separate approved phase:

- Provider API keys configured in Vercel only
- No AI key in client code

## Health Checks

Shallow health:

- `GET /api/health`
- Expected: `status: ok` or `status: degraded`
- Safe output: app name, environment name, timestamp, request id, duration, version/commit if configured, and boolean env presence only

Deep health:

- `GET /api/health?deep=1`
- Expected: includes a Supabase connectivity check
- Rate limited to reduce operational noise
- Does not return rows, keys, URLs, tokens, user data, or stack traces

Use `x-request-id` from the response when correlating Vercel logs with support or incident reports.

## Post-Deploy Smoke Test Checklist

1. Login with a normal customer account.
2. Open `/dashboard`; confirm dashboard summary loads without console errors.
3. Open `/clients`; confirm the list loads and empty state still works.
4. Open `/tasks`; confirm task list and filters still work.
5. Open `/finance`; confirm transactions and summaries load.
6. Open `/employees`; confirm employees list loads.
7. Open `/owner` with an owner account, if available.
8. Create client login from owner tools in a test tenant only.
9. Reset client password from owner tools in a test tenant only.
10. Call `/api/tenant/dashboard-summary` while authenticated and confirm a bounded response.
11. Call `/api/automation/run-scheduled` without `CRON_SECRET`; expected: `401`.
12. Call `/api/health`; expected: `status: ok`.
13. Call `/api/health?deep=1`; expected: `status: ok` or a clear `degraded` reason with no secrets.

## Rollback Steps

1. In Vercel, identify the last known-good production deployment.
2. Promote or redeploy the last known-good deployment.
3. Confirm `/api/health` and `/dashboard` after rollback.
4. Pause scheduled automation if the incident involves cron writes.
5. Do not run manual database changes unless an approved recovery plan requires them.
6. Document the rollback reason, request ids, affected routes, and customer impact.

## Incident Response

1. Assign one incident owner.
2. Capture the time window, affected routes, request ids, Vercel deployment id, and Supabase project status.
3. Check `/api/health` and `/api/health?deep=1`.
4. Review Vercel runtime logs using request ids.
5. Review Supabase logs, auth logs, API errors, and advisors.
6. If customer data exposure is suspected, stop feature rollout and escalate before making changes.
7. Apply the smallest safe mitigation first: rollback, disable cron, or rate-limit traffic.
8. Write a post-incident note with cause, fix, prevention, and follow-up phase.

## Backup And Recovery Checklist

- Confirm Supabase automated backups are enabled for the production plan.
- Confirm point-in-time recovery availability and retention period.
- Keep a documented restore procedure outside the app repository.
- Test restore in a non-production environment before relying on it.
- Export critical operational settings before major releases.
- Never restore production over production without explicit approval and a customer impact plan.

## Supabase Monitoring Checklist

- Database CPU, memory, connections, and disk growth.
- Slow queries and missing index advisors.
- Auth error rates and email delivery errors.
- Realtime channel pressure.
- API 4xx/5xx patterns.
- RLS policy performance and tenant isolation test results.
- Service role usage limited to server routes only.

## Vercel Monitoring Checklist

- Build status and deploy duration.
- Runtime function errors.
- Function duration and memory usage.
- Cron execution status.
- Web analytics and Speed Insights if enabled.
- Environment variable drift between Preview and Production.
- Failed font or third-party asset fetches in build logs.

## Error Monitoring Recommendation

No paid tool is required for this phase. Recommended next integrations:

- Sentry or an equivalent error monitor for server and browser exceptions.
- Vercel runtime logs and alerts for API error spikes.
- Supabase logs and advisors for database/auth issues.
- External uptime monitor for `/api/health`.
- Separate private deep-health monitor for `/api/health?deep=1`.

## Operational Rules

- Do not log bearer tokens, service-role keys, passwords, payment details, full emails, or customer-private data.
- Prefer request ids over customer identifiers when tracing incidents.
- Keep deep operational diagnostics server-side.
- Treat migrations, auth changes, RLS changes, and payment changes as separate approved phases.
