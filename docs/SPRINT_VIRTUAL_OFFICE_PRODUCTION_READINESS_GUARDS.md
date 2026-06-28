# Sprint Virtual Office Production Readiness Guards

## Root Cause

Production had Virtual Office API code deployed before the required Supabase table existed. The APIs depend on `tenant_virtual_office_rooms`, so tenants could reach the Virtual Office surface while the backing persistence layer was incomplete.

The fix is not a UI change. The API now performs explicit readiness checks before reading or writing Virtual Office rooms.

## Required Database Table

`public.tenant_virtual_office_rooms`

Expected purpose:

- Stores each tenant organization's fixed Virtual Office room state.
- Scopes every row by `organization_id`.
- Supports stable room keys and room numbers.
- Tracks room open/closed state without deleting tenant data.

## Required Package Feature

`virtual_office`

Access must come from package features, not a hardcoded plan slug. Premium tenants can use the APIs only when their effective package has a `plan_features.feature_key = 'virtual_office'` row.

Basic/Growth remain locked unless the Owner explicitly enables `virtual_office` for those plans.

## Required RLS Policies

The table must keep tenant isolation through RLS:

- Tenant users can select only rows for their own `organization_id`.
- Tenant managers can insert/update only rows for their own `organization_id`.
- Policies must not allow cross-tenant reads or writes.
- Owner/service maintenance paths must remain server-side only.

## Readiness Guard Behavior

Every Virtual Office API route now checks:

1. Valid tenant session.
2. Tenant has an organization.
3. Effective package feature includes `virtual_office`.
4. `tenant_virtual_office_rooms` exists before room queries run.

If the table is missing, the API returns:

```json
{
  "error": "إعداد المكتب الافتراضي غير مكتمل — تواصل مع الدعم",
  "code": "virtual_office_table_missing"
}
```

with HTTP status `503`.

## Manual Verification Checklist

- Confirm `public.tenant_virtual_office_rooms` exists in Supabase production.
- Confirm RLS is enabled on `public.tenant_virtual_office_rooms`.
- Confirm tenant select/insert/update policies are scoped by `organization_id`.
- Confirm the tenant's effective package has `virtual_office` in `plan_features`.
- Sign in as a premium tenant and call `/api/tenant/virtual-office/rooms`.
- Confirm Basic/Growth tenants are blocked unless Owner enabled `virtual_office`.
- Temporarily test against an environment without the table and confirm the `503` response code and `virtual_office_table_missing` JSON code.
- Confirm `/virtual-office` is classified as a customer workspace route.

## 1000-Customer Readiness Checklist

- Apply migrations before deploying Virtual Office API code.
- Monitor `virtual_office_table_missing` responses after deploy.
- Alert support/ops on any `503` readiness failure.
- Confirm no cross-tenant rows are visible in sampled tenant accounts.
- Confirm default-room upserts are idempotent per organization.
- Confirm room updates always include `organization_id` filters.
- Confirm package feature saves refresh open customer dashboards.
- Confirm plan truth uses live subscriptions before organization fallback.

## Non-Changes Confirmation

No dashboard UI changed.
No Virtual Office visuals changed.
No office scene changed.
No package defaults changed.
No package gating bypass was added.
No Auth, RLS, middleware security weakening was made.
