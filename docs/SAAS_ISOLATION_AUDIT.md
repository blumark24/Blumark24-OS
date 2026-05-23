# SaaS Isolation Refactor — Production Audit

## Architecture

- **Owner Platform** (`/owner`): platform owner manages organizations, plans, subscriptions. `is_owner()` RLS.
- **Tenant Workspace**: all routes gated by `organization_id` RLS + `plan_features` + RBAC.
- **Blumark Workspace** (`blumark24-internal`): normal tenant — no package bypass via `is_internal`.

## Database (migration 020)

Apply: `supabase db push` or run `supabase/migrations/020_saas_package_departments.sql`.

- `plan_features` — runtime module toggles per plan (seeded basic/growth/advanced).
- `departments` — org-scoped taxonomy with `max_departments` enforcement.
- Backfill departments from `employees.department`.
- `strategy_phases` NULL `organization_id` rows scoped to internal org slug.

## Security validation checklist

| Test | Expected |
|------|----------|
| Tenant A vs Tenant B | No cross-org rows on employees, clients, tasks, departments |
| Package basic | No employees/finance/automation nav |
| Package advanced | Full module set per `plan_features` |
| Dept dropdown | Only current org `departments` |
| `/attack` | Removed |
| Static dept arrays | None in `src/` tenant UI |

## API

- `GET /api/tenant/workspace-context` returns `enabledFeatures`, `planLimits`, `planSlug`, `organizationId`.
- Fail-closed: no RPC fallback widening package on error.
