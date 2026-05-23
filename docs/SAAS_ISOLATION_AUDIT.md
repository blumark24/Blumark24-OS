# SaaS Isolation — PR #164 Final Audit

## Package feature matrix (migration 020 seed)

| Module | basic | growth | advanced |
|--------|:-----:|:------:|:--------:|
| dashboard | yes | yes | yes |
| tasks | yes | yes | yes |
| clients | yes | yes | yes |
| org | yes | yes | yes |
| ai | yes | yes | yes |
| reports | yes | yes | yes |
| employees | — | yes | yes |
| strategy | — | yes | yes |
| finance | — | — | yes |
| automation | — | — | yes |

`plan_limits` (from migration 009, unchanged): `max_departments`, `max_employees`, `ai_level`, `whatsapp_enabled`, etc. per plan slug.

## Runtime rules

- Tenant modules come **only** from `plan_features` rows (no `is_internal` bypass).
- Empty/missing `plan_features` → `featuresConfigured: false`, empty nav (fail-closed).
- Owner changes plan via `/owner/organizations` → `ChangePlanModal` → `changeOrganizationPlan()` updates `organizations.plan_id`.
- Tenant refreshes context on login/navigation; nav uses `enabledFeatures` from `/api/tenant/workspace-context`.

## Migration 020

See PR body and `supabase/migrations/020_saas_package_departments.sql`.
