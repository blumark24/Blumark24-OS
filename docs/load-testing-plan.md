# C12 Load Testing And Scale Validation Plan

This plan validates Blumark24 OS readiness for 100, 500, and 1000 customer tenants without touching production data or changing product behavior. Do not run load tests against production without explicit approval.

## Safety Rules

- Use staging, Vercel preview, or a Supabase branch/project for load testing.
- Do not seed, mutate, delete, or backfill production data.
- Do not run destructive tests.
- Do not automate owner/admin service-role routes without approved test credentials.
- Do not load test cron execution without explicit approval.
- Never commit bearer tokens, service-role keys, Supabase keys, or customer data.

## Tooling

C12 adds a lightweight Node-based script:

- `scripts/load-test/load-test.mjs`

Supported environment variables:

- `LOAD_TEST_BASE_URL`: target base URL, for example a Vercel preview URL
- `LOAD_TEST_BEARER_TOKEN`: optional Supabase bearer token for authenticated tenant routes
- `LOAD_TEST_SCENARIO`: `health`, `dashboard-summary`, or `smoke`
- `LOAD_TEST_DURATION`: duration in seconds
- `LOAD_TEST_VUS`: virtual users
- `LOAD_TEST_DRY_RUN`: set to `1` to print config without sending requests

Package scripts:

- `npm.cmd run load:test:health`
- `npm.cmd run load:test:dashboard-summary`
- `npm.cmd run load:test:smoke`

These scripts never run automatically during build or CI.

## Target Route Groups

### Public / Safe

- `GET /api/health`
- `GET /api/health?deep=1` at low rate only

Expected behavior:

- No secrets returned.
- `status` is `ok` or a clear `degraded` reason.
- Deep health remains rate limited and operational-only.

### Authenticated Tenant

- `GET /dashboard` page load if browser/auth test tooling is available.
- `GET /api/tenant/dashboard-summary` with `LOAD_TEST_BEARER_TOKEN`.

Expected behavior:

- Valid token returns tenant-scoped summary only.
- Missing token returns auth failure.
- No tenant data leakage.

### Owner / Admin

Document only unless approved test credentials are provided:

- `/api/owner/provision-tenant`
- `/api/owner/change-organization-plan`
- `/api/owner/create-client-login`
- `/api/owner/reset-client-password`
- `/api/admin/create-user`
- `/api/admin/update-user`
- `/api/admin/delete-user`

Expected behavior:

- No automated load test in C12.
- Use targeted functional checks in staging with explicit owner approval.

### Cron / Internal

Document only unless explicitly approved:

- `/api/automation/run-scheduled`

Expected behavior:

- Unauthorized requests return `401`.
- Do not run cron execution load unless staging data and `CRON_SECRET` approval are available.

## Test Data Policy

No C12 script creates data. For realistic tenant scale validation, prepare a staging project or Supabase branch with:

- 100, 500, or 1000 organizations.
- A small number of clients, tasks, transactions, employees, projects, and activities per test tenant.
- At least one customer login/token per target tenant cohort.
- No real production customer PII.
- No service-role keys shared with test operators.

Seed shape recommendation:

- Basic tenant: 5 clients, 10 tasks, 10 transactions, 2 employees.
- Growth tenant: 25 clients, 50 tasks, 50 transactions, 8 employees.
- Advanced tenant: 100 clients, 250 tasks, 250 transactions, 25 employees.

Do not apply migrations or seed data from C12 tooling.

## Test Levels

### Level 1: 25 Concurrent Users

- Goal: preview smoke and baseline latency.
- Target routes:
  - `GET /api/health`
  - `GET /api/health?deep=1` low rate only
  - `GET /api/tenant/dashboard-summary` with one staging tenant token
- Request rate: 25 VUs, roughly continuous requests.
- Duration: 5 minutes.
- Ramp-up: 1 minute.
- Pass/fail:
  - p95 health < 800ms
  - p95 dashboard-summary < 1500ms
  - 5xx < 1%
  - 429 < 5% for health and expected only if deep health is overused
- Watch:
  - Vercel function duration/errors
  - Supabase API latency
  - rate-limit denials
- Stop conditions:
  - 5xx >= 5%
  - Supabase CPU or connections spike abnormally
  - any cross-tenant data exposure signal

### Level 2: 100 Customer Tenants

- Goal: validate customer dashboard summary path for early production.
- Target routes:
  - `GET /api/health`
  - `GET /api/tenant/dashboard-summary` across representative tenant tokens
- Request rate: 100 tenant-equivalent users, staged by token cohorts.
- Duration: 10 minutes.
- Ramp-up: 3 minutes.
- Pass/fail:
  - p95 health < 800ms
  - p95 dashboard-summary < 1500ms
  - p99 dashboard-summary < 3000ms
  - 5xx < 1%
  - tenant isolation verified by sampled responses
- Watch:
  - Supabase CPU, DB connections, slow queries, and API logs
  - Vercel function error and duration charts
  - dashboard summary route rate-limit behavior
- Stop conditions:
  - sustained 5xx >= 3%
  - p95 dashboard-summary > 3000ms for 3 consecutive minutes
  - Supabase connection pressure approaches plan limits

### Level 3: 500 Customer Tenants

- Goal: validate scale before broad launch.
- Target routes:
  - `GET /api/health`
  - `GET /api/tenant/dashboard-summary`
  - browser-level `/dashboard` page load if authenticated browser tooling is available
- Request rate: 500 tenant-equivalent users in waves.
- Duration: 20 minutes.
- Ramp-up: 5 minutes.
- Pass/fail:
  - p95 health < 1000ms
  - p95 dashboard-summary < 2000ms
  - p99 dashboard-summary < 4000ms
  - 5xx < 1%
  - 429 rate explained by configured limits only
- Watch:
  - Supabase slow queries and advisor output
  - Realtime subscription pressure
  - Vercel memory and cold start patterns
  - network timeout rate
- Stop conditions:
  - p99 > 6000ms for 3 consecutive minutes
  - database CPU sustained above safe plan threshold
  - function timeout rate > 1%

### Level 4: 1000 Customer Tenants

- Goal: production-scale readiness validation.
- Target routes:
  - `GET /api/health`
  - `GET /api/tenant/dashboard-summary`
  - selected authenticated customer page loads through browser tooling
- Request rate: 1000 tenant-equivalent users, gradually ramped.
- Duration: 30 minutes.
- Ramp-up: 10 minutes.
- Pass/fail:
  - p95 health < 1200ms
  - p95 dashboard-summary < 2500ms
  - p99 dashboard-summary < 5000ms
  - 5xx < 1%
  - no tenant data leakage
  - Supabase and Vercel remain within plan limits
- Watch:
  - Supabase CPU, memory, connections, storage I/O, API latency
  - Vercel function duration, memory, errors, and throttling
  - rate-limit behavior
  - browser page load if tested
- Stop conditions:
  - any suspected data isolation issue
  - sustained 5xx >= 2%
  - sustained p95 dashboard-summary > 5000ms
  - Supabase or Vercel plan limits approached

## Running Safe Scenarios

Dry run only:

```powershell
$env:LOAD_TEST_DRY_RUN='1'
npm.cmd run load:test:smoke
```

Health-only staging run:

```powershell
$env:LOAD_TEST_BASE_URL='https://your-preview.example'
$env:LOAD_TEST_VUS='25'
$env:LOAD_TEST_DURATION='60'
npm.cmd run load:test:health
```

Authenticated dashboard-summary staging run:

```powershell
$env:LOAD_TEST_BASE_URL='https://your-preview.example'
$env:LOAD_TEST_BEARER_TOKEN='<staging tenant token>'
$env:LOAD_TEST_VUS='25'
$env:LOAD_TEST_DURATION='60'
npm.cmd run load:test:dashboard-summary
```

Do not use production bearer tokens for C12 tests without explicit approval.

## Pass / Fail Thresholds

Conservative default thresholds:

- p95 health < 800ms under moderate load.
- p95 dashboard-summary < 1500ms under moderate load.
- 5xx < 1%.
- 429 rate is expected only when a configured limiter is intentionally exceeded.
- Timeout rate < 1%.
- Auth failures expected only when token is missing or invalid.
- No tenant data leakage.

## Monitoring Checklist

Vercel:

- Function duration.
- Function errors.
- Memory usage.
- Timeout count.
- Cold start patterns.
- Deployment logs.

Supabase:

- API latency.
- Database CPU.
- Database connections.
- Slow queries.
- Auth errors.
- Realtime pressure.
- Storage and I/O if reports/files are included later.

Application:

- `x-request-id` correlation.
- Rate-limit denials.
- Health endpoint status.
- Dashboard summary response status.

## Rollback And Stop Conditions

Stop the test immediately if:

- Any suspected tenant data leakage appears.
- Production receives accidental load.
- 5xx rises above the level target.
- Database or Vercel limits approach unsafe thresholds.
- Owner/admin or cron routes are hit accidentally.

Rollback or mitigation:

- Stop load generator.
- Disable any scheduled test job.
- Revert to last known-good deployment if user-facing impact occurs.
- Preserve request ids and time windows for investigation.

## Next Step After C12

After staging load tests are run, summarize results in `docs/load-test-report-template.md` format and decide whether to proceed to:

- C13 production launch readiness fixes.
- Dedicated Supabase index/RPC optimization.
- Next.js major upgrade assessment.
- Payment gateway implementation phase.
