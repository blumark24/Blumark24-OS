# Sprint 1A — Safety Gates

Date: 2026-06-27
Scope: devops/safety only. No product UI, Auth, RLS, middleware, Supabase
migrations, API routes, or business logic were modified.

## What Changed

- `scripts/load-test/load-test.mjs`
  - Exits non-zero (`process.exitCode = 1`) when any threshold fails.
  - New gates:
    - `errorRate > LOAD_TEST_MAX_ERROR_RATE` (default `0.01`)
    - `p95 > LOAD_TEST_MAX_P95_MS` ms (default `1500`)
    - Any status outside 2xx (and not in `LOAD_TEST_ALLOWED_STATUSES`)
    - `total === 0` (no requests executed — never a silent pass)
  - Configurable via env or CLI flags:
    - `LOAD_TEST_MAX_ERROR_RATE` / `--max-error-rate=`
    - `LOAD_TEST_MAX_P95_MS` / `--max-p95-ms=`
    - `LOAD_TEST_ALLOWED_STATUSES` / `--allowed-statuses=` (comma list, e.g. `204,304`)
  - Prints `PASS — …` line on success; on failure prints `FAIL — …` followed
    by a bulleted list of exact reasons.
  - JSON `load_test_complete` event now includes `thresholds`, `result`
    (`"PASS"` | `"FAIL"`), and `failures[]`.

- `.github/workflows/safety-gates.yml`
  - Runs on `pull_request` and `push` to `main`.
  - Steps: `npm ci` → `npm run lint` → `npm run build` → `npm run verify:isolation`.
  - No Supabase secrets required; `verify:isolation` runs in static-only mode
    when env is absent.

- `docs/SPRINT_1A_SAFETY_GATES.md` (this file).

No `package.json` script changes were needed — existing
`load:test:smoke`, `lint`, `build`, and `verify:isolation` scripts already
expose every command CI runs.

## Commands To Run

```bash
npm ci
npm run lint
npm run build
npm run verify:isolation
npm run load:test:smoke -- --duration=5 --vus=2
```

Tune thresholds when running smoke against a live server:

```bash
LOAD_TEST_MAX_ERROR_RATE=0.01 \
LOAD_TEST_MAX_P95_MS=800 \
npm run load:test:smoke -- --duration=30 --vus=10
```

## Verified Acceptance (local)

| Check | Result |
|---|---|
| `npm run lint` | PASS (1 pre-existing `<img>` warning in `virtual-office-guide`) |
| `npm run build` | PASS |
| `npm run verify:isolation` | PASS (static; live DB skipped when env absent) |
| `npm run load:test:smoke` with no server | FAIL with exit 1, exact reasons printed |
| Product code touched | None |

## What Is Still Not Covered

- **Live Supabase tenant isolation probe.** `verify:isolation` still skips the
  live cross-tenant query when `NEXT_PUBLIC_SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY` are absent — required secrets are not in CI by
  design (see Sprint 1B).
- **No durable rate limiting.** `src/lib/rateLimit.ts` is still in-memory; this
  sprint did not touch product code.
- **No server-side plan-feature gate on `/api/tenant/*`.** Still UI-level only.
- **Owner allowlist regression test missing.** No CI assertion that owner
  email allowlist or `OwnerGuard` behavior is intact.
- **Bundle-size budget not enforced.** `/org` (84.4 kB) and `/virtual-office`
  (34.6 kB) still ship without a CI size gate.
- **Boot-time env validation missing.** `scripts/check-env.mjs` was scoped as
  optional and is not added in this sprint.
- **Smoke load test still runs against `127.0.0.1:3000` only.** No automated
  launch of the Next.js server in CI, so smoke is not yet a CI job.
- **No support flow** — still absent from middleware, routes, and gating.

## Next Recommended Sprint — 1B (devops, still no product code)

1. Add `scripts/check-env.mjs` and wire it as a `prebuild` script — fails fast
   if required envs are missing.
2. Add a CI job that boots `next start` and runs `load:test:smoke` against it
   with strict thresholds; keep it separate from `safety-gates.yml` so it can
   be required selectively.
3. Add bundle-size budget check (e.g. `@next/bundle-analyzer` report compared
   against committed thresholds in `docs/`).
4. Extend `scripts/verify-tenant-isolation.mjs` with a live cross-tenant probe
   gated on `LIVE_ISOLATION=1`; document required test-tenant seeds.
5. Add a CI step that fails when new files appear under forbidden audit paths
   in a `docs:`/`chore:` commit (lightweight allowlist diff check).
6. Spec the `/support` flow and durable rate-limit backend in `docs/` so the
   first product-code sprint has a clear contract.
