-- ============================================================
-- Repair organization package truth from live subscriptions
-- Date: 2026-06-28
--
-- WHY:
--   Tenant workspace context now treats the latest live subscription as the
--   effective package truth. Older data can still have organizations.plan_id
--   set to NULL or a stale plan while subscriptions.plan_id is correct.
--
-- SAFETY:
--   - Does not create subscriptions.
--   - Does not delete subscriptions.
--   - Does not change plan_features.
--   - Does not change prices.
--   - Does not change RLS or Auth.
-- ============================================================

WITH latest_live_subscription AS (
  SELECT
    s.organization_id,
    s.plan_id,
    row_number() OVER (
      PARTITION BY s.organization_id
      ORDER BY
        s.updated_at DESC NULLS LAST,
        s.started_at DESC NULLS LAST,
        s.created_at DESC NULLS LAST,
        s.id DESC
    ) AS rn
  FROM public.subscriptions s
  WHERE s.status IN ('active', 'trialing', 'past_due')
    AND s.plan_id IS NOT NULL
),
repair AS (
  SELECT
    o.id AS organization_id,
    o.plan_id AS old_plan_id,
    lls.plan_id AS live_subscription_plan_id
  FROM public.organizations o
  JOIN latest_live_subscription lls
    ON lls.organization_id = o.id
   AND lls.rn = 1
  WHERE o.plan_id IS DISTINCT FROM lls.plan_id
)
UPDATE public.organizations o
SET
  plan_id = repair.live_subscription_plan_id,
  updated_at = now()
FROM repair
WHERE o.id = repair.organization_id;

-- Optional verification query:
-- WITH latest_live_subscription AS (
--   SELECT
--     s.organization_id,
--     s.plan_id,
--     row_number() OVER (
--       PARTITION BY s.organization_id
--       ORDER BY s.updated_at DESC NULLS LAST, s.started_at DESC NULLS LAST, s.created_at DESC NULLS LAST, s.id DESC
--     ) AS rn
--   FROM public.subscriptions s
--   WHERE s.status IN ('active', 'trialing', 'past_due')
--     AND s.plan_id IS NOT NULL
-- )
-- SELECT
--   o.id AS organization_id,
--   o.name AS organization_name,
--   o.plan_id AS organization_plan_id,
--   lls.plan_id AS live_subscription_plan_id,
--   (o.plan_id IS DISTINCT FROM lls.plan_id) AS plan_mismatch
-- FROM public.organizations o
-- JOIN latest_live_subscription lls
--   ON lls.organization_id = o.id
--  AND lls.rn = 1
-- WHERE o.plan_id IS DISTINCT FROM lls.plan_id
-- ORDER BY o.updated_at DESC;
