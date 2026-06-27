# Sprint Package Truth Sync Client Unlock Repair

## Root cause

The Owner Panel can save `plan_features` correctly, but the customer dashboard previously resolved package access from `organizations.plan_id` only. If a tenant had a live subscription on Enterprise while `organizations.plan_id` was old, null, or mismatched, `/api/tenant/workspace-context` loaded features for the wrong plan and kept routes such as Virtual Office locked.

## Package truth tables

- `plan_features`: feature switches per package. This controls which modules can appear in the tenant workspace.
- `organizations.plan_id`: denormalized organization package pointer used as a fallback and for owner/customer display.
- `subscriptions.plan_id`: billing/subscription package pointer. A live subscription is the strongest signal of the package the customer currently owns.

## Why Owner showed saved features but client stayed locked

Owner feature saving writes rows in `plan_features` for a plan. The tenant dashboard then asks `/api/tenant/workspace-context` for `enabledFeatures`. Before this repair, that API used `organizations.plan_id` to choose the plan. When the organization row pointed at Basic/Growth while the live subscription pointed at Enterprise, the saved Enterprise features were never read by the client dashboard.

## Effective plan algorithm

`/api/tenant/workspace-context` now resolves the effective tenant package as follows:

1. Read the tenant organization by `orgId`.
2. Read the latest live subscription for that organization where status is `active`, `trialing`, or `past_due`.
3. If the live subscription has `plan_id`, use it as `effectivePlanId`.
4. Otherwise fallback to `organizations.plan_id`.
5. Read plan slug/name, `plan_features`, and `plan_limits` from `effectivePlanId`.
6. Return diagnostics: `effectivePlanId`, `effectivePlanSlug`, `effectivePlanSource`, `organizationPlanId`, `liveSubscriptionPlanId`, and `planMismatch`.

If no effective plan exists, no premium features are granted.

## Data repair migration

Migration: `20260628090000_repair_organization_plan_from_live_subscription.sql`

The migration finds each organization's latest live subscription and updates `organizations.plan_id` when it is null or different from the live subscription plan. It also updates `organizations.updated_at`.

It does not create subscriptions, delete subscriptions, change `plan_features`, change prices, change RLS, change Auth, or alter dashboard visuals.

## Verification SQL

Plans:

```sql
SELECT id, slug, name, is_active, sort_order
FROM public.plans
ORDER BY sort_order;
```

Plan features:

```sql
SELECT
  p.slug,
  p.name,
  array_agg(pf.feature_key ORDER BY pf.feature_key) AS features
FROM public.plans p
LEFT JOIN public.plan_features pf ON pf.plan_id = p.id
GROUP BY p.id, p.slug, p.name, p.sort_order
ORDER BY p.sort_order;
```

Organizations:

```sql
SELECT
  o.id,
  o.name,
  o.plan_id,
  p.slug AS organization_plan_slug,
  o.status,
  o.updated_at
FROM public.organizations o
LEFT JOIN public.plans p ON p.id = o.plan_id
ORDER BY o.updated_at DESC NULLS LAST;
```

Subscriptions and mismatches:

```sql
WITH latest_live_subscription AS (
  SELECT
    s.organization_id,
    s.plan_id,
    s.status,
    row_number() OVER (
      PARTITION BY s.organization_id
      ORDER BY s.updated_at DESC NULLS LAST, s.started_at DESC NULLS LAST, s.created_at DESC NULLS LAST, s.id DESC
    ) AS rn
  FROM public.subscriptions s
  WHERE s.status IN ('active', 'trialing', 'past_due')
    AND s.plan_id IS NOT NULL
)
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  o.plan_id AS organization_plan_id,
  op.slug AS organization_plan_slug,
  lls.plan_id AS live_subscription_plan_id,
  sp.slug AS live_subscription_plan_slug,
  lls.status AS live_subscription_status,
  (o.plan_id IS DISTINCT FROM lls.plan_id) AS plan_mismatch
FROM public.organizations o
LEFT JOIN latest_live_subscription lls
  ON lls.organization_id = o.id
 AND lls.rn = 1
LEFT JOIN public.plans op ON op.id = o.plan_id
LEFT JOIN public.plans sp ON sp.id = lls.plan_id
ORDER BY plan_mismatch DESC, o.updated_at DESC NULLS LAST;
```

## Client dashboard verification

Call `/api/tenant/workspace-context` as a tenant user and confirm:

- `planId`, `planSlug`, and `planName` reflect the effective plan.
- `effectivePlanSource` is `live_subscription` when a live subscription exists.
- `enabledFeatures` includes `virtual_office` only when the effective plan has that `plan_features` row.
- `planMismatch` is true only when the live subscription and organization plan differ.

Virtual Office remains package gated through workspace context and route filtering. Basic/Growth remain locked by default unless the Owner explicitly enables `virtual_office` for those plans.

## Confirmed non-changes

No dashboard visual redesign, Virtual Office visual change, Auth change, RLS change, middleware change, price change, or route-gating bypass was made.
