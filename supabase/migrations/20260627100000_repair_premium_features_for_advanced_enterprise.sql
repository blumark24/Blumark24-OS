-- Repair — premium feature parity for Advanced + Enterprise
--
-- WHY:
--   Sprint 1B made virtual_office and external_integrations canonical
--   workspace features for the Advanced and Enterprise plans in the
--   TypeScript matrix (src/lib/features/packageFeatures.ts). The A3
--   sync migration (20260619200000_a3_sync_canonical_plan_features.sql)
--   shipped before Sprint 1B and its canonical CTE does not include
--   these two keys — and its DELETE step removes any plan_features
--   row that is not in that CTE. Net effect in production:
--     * Advanced + Enterprise have NO plan_features row for
--       virtual_office or external_integrations.
--     * /api/tenant/workspace-context reads plan_features directly,
--       so Enterprise tenants are blocked from /virtual-office even
--       though the plan is marketed to include it.
--
-- WHAT THIS MIGRATION DOES:
--   * Inserts virtual_office and external_integrations into
--     plan_features for slugs `advanced` and `enterprise` only.
--   * Idempotent via ON CONFLICT (plan_id, feature_key) DO NOTHING.
--
-- WHAT THIS MIGRATION DOES NOT DO:
--   * No DELETE — existing plan_features rows are preserved.
--   * No change to plans (prices, slugs, names, sort_order, is_active).
--   * No change to subscriptions or organizations.
--   * No change to plan_limits.
--   * No change to RLS policies, Auth, or any helper function.
--   * No change to basic or growth plans — those tenants gain nothing
--     unless the owner explicitly grants them later.
--
-- SAFETY:
--   * Skips silently if the `advanced` / `enterprise` rows in `plans`
--     do not exist on this database.
--   * Skips silently if the `plan_features` table is missing.

DO $$
BEGIN
  IF to_regclass('public.plans') IS NULL THEN
    RAISE NOTICE 'plans table missing — skipping premium feature repair';
    RETURN;
  END IF;

  IF to_regclass('public.plan_features') IS NULL THEN
    RAISE NOTICE 'plan_features table missing — skipping premium feature repair';
    RETURN;
  END IF;
END $$;

WITH target_plans AS (
  SELECT id, slug
  FROM public.plans
  WHERE slug IN ('advanced', 'enterprise')
),
premium_features(feature_key) AS (
  VALUES
    ('virtual_office'),
    ('external_integrations')
)
INSERT INTO public.plan_features (plan_id, feature_key)
SELECT p.id, f.feature_key
FROM target_plans p
CROSS JOIN premium_features f
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- ── Verification helper (read-only; commented out) ──────────────────
-- SELECT p.slug,
--        array_agg(pf.feature_key ORDER BY pf.feature_key) AS features
-- FROM public.plans p
-- LEFT JOIN public.plan_features pf ON pf.plan_id = p.id
-- WHERE p.slug IN ('advanced', 'enterprise')
-- GROUP BY p.slug;
-- Expected: each row's `features` array contains
--   'virtual_office' and 'external_integrations'.
