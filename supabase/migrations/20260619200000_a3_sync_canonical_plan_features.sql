-- ============================================================
-- A3 — PROFESSIONAL PLAN MANAGEMENT ENGINE
-- Date: 2026-06-19
-- Scope: Plans / Pricing / Subscriptions
--
-- WHY:
--   A3 audit found three commercial-readiness gaps:
--
--   1. `plan_features` in production did not match the TypeScript matrix in
--      src/lib/features/packageFeatures.ts.
--   2. Production plan prices were NULL while the TypeScript canonical pricing
--      defines base prices: basic=299, growth=599, advanced=999 SAR/month.
--   3. `subscriptions` had no database-level uniqueness guard for one active
--      subscription per organization; UI-only checks can race.
--
-- DECISION:
--   Use src/lib/features/packageFeatures.ts as the canonical plan matrix and
--   pricing source.
--
-- SAFETY:
--   - Does not delete organizations.
--   - Does not delete subscriptions.
--   - Does not alter UI/design.
--   - Does not touch /ai implementation.
--   - Only synchronizes known commercial plan slugs.
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.plans') IS NULL THEN
    RAISE EXCEPTION 'A3 requires public.plans';
  END IF;

  IF to_regclass('public.plan_features') IS NULL THEN
    RAISE EXCEPTION 'A3 requires public.plan_features';
  END IF;

  IF to_regclass('public.subscriptions') IS NULL THEN
    RAISE EXCEPTION 'A3 requires public.subscriptions';
  END IF;
END $$;

-- ── 1. Upsert canonical plans and pricing ─────────────────────
-- Base prices are canonical. Launch offer is handled as a discount/coupon,
-- never stored as the base price.
INSERT INTO public.plans (name, slug, price_monthly, price_annual, is_active, sort_order)
VALUES
  ('أساسي',  'basic',      299,  2990,  true, 1),
  ('نمو',    'growth',     599,  5990,  true, 2),
  ('متقدم', 'advanced',   999,  9990,  true, 3),
  ('مؤسسي', 'enterprise', NULL, NULL,  true, 4)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_annual = EXCLUDED.price_annual,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- ── 2. Sync canonical feature matrix ──────────────────────────
WITH canonical(slug, feature_key) AS (
  VALUES
    ('basic', 'dashboard'),
    ('basic', 'tasks'),
    ('basic', 'clients'),
    ('basic', 'employees'),
    ('basic', 'reports'),

    ('growth', 'dashboard'),
    ('growth', 'tasks'),
    ('growth', 'clients'),
    ('growth', 'employees'),
    ('growth', 'reports'),
    ('growth', 'org'),
    ('growth', 'finance'),

    ('advanced', 'dashboard'),
    ('advanced', 'tasks'),
    ('advanced', 'clients'),
    ('advanced', 'employees'),
    ('advanced', 'reports'),
    ('advanced', 'org'),
    ('advanced', 'finance'),
    ('advanced', 'strategy'),
    ('advanced', 'automation'),

    ('enterprise', 'dashboard'),
    ('enterprise', 'tasks'),
    ('enterprise', 'clients'),
    ('enterprise', 'employees'),
    ('enterprise', 'reports'),
    ('enterprise', 'org'),
    ('enterprise', 'finance'),
    ('enterprise', 'strategy'),
    ('enterprise', 'automation'),
    ('enterprise', 'ai')
), known_plans AS (
  SELECT id, slug
  FROM public.plans
  WHERE slug IN ('basic', 'growth', 'advanced', 'enterprise')
)
DELETE FROM public.plan_features pf
USING known_plans p
WHERE pf.plan_id = p.id
  AND NOT EXISTS (
    SELECT 1
    FROM canonical c
    WHERE c.slug = p.slug
      AND c.feature_key = pf.feature_key
  );

WITH canonical(slug, feature_key) AS (
  VALUES
    ('basic', 'dashboard'),
    ('basic', 'tasks'),
    ('basic', 'clients'),
    ('basic', 'employees'),
    ('basic', 'reports'),

    ('growth', 'dashboard'),
    ('growth', 'tasks'),
    ('growth', 'clients'),
    ('growth', 'employees'),
    ('growth', 'reports'),
    ('growth', 'org'),
    ('growth', 'finance'),

    ('advanced', 'dashboard'),
    ('advanced', 'tasks'),
    ('advanced', 'clients'),
    ('advanced', 'employees'),
    ('advanced', 'reports'),
    ('advanced', 'org'),
    ('advanced', 'finance'),
    ('advanced', 'strategy'),
    ('advanced', 'automation'),

    ('enterprise', 'dashboard'),
    ('enterprise', 'tasks'),
    ('enterprise', 'clients'),
    ('enterprise', 'employees'),
    ('enterprise', 'reports'),
    ('enterprise', 'org'),
    ('enterprise', 'finance'),
    ('enterprise', 'strategy'),
    ('enterprise', 'automation'),
    ('enterprise', 'ai')
)
INSERT INTO public.plan_features (plan_id, feature_key)
SELECT p.id, c.feature_key
FROM public.plans p
JOIN canonical c ON c.slug = p.slug
WHERE p.slug IN ('basic', 'growth', 'advanced', 'enterprise')
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- ── 3. Sync canonical limits ──────────────────────────────────
-- These values match the current owner UI shape: max_employees, max_agencies,
-- max_departments, max_sections, ai_level, whatsapp_enabled.
WITH canonical_limits(slug, limit_key, limit_value) AS (
  VALUES
    ('basic', 'max_employees', 5),
    ('basic', 'max_agencies', 0),
    ('basic', 'max_departments', 1),
    ('basic', 'max_sections', 3),
    ('basic', 'ai_level', 0),
    ('basic', 'whatsapp_enabled', 0),

    ('growth', 'max_employees', 15),
    ('growth', 'max_agencies', 1),
    ('growth', 'max_departments', 5),
    ('growth', 'max_sections', 20),
    ('growth', 'ai_level', 0),
    ('growth', 'whatsapp_enabled', 1),

    ('advanced', 'max_employees', 40),
    ('advanced', 'max_agencies', 10),
    ('advanced', 'max_departments', 50),
    ('advanced', 'max_sections', 200),
    ('advanced', 'ai_level', 0),
    ('advanced', 'whatsapp_enabled', 1),

    ('enterprise', 'max_employees', 999),
    ('enterprise', 'max_agencies', 999),
    ('enterprise', 'max_departments', 999),
    ('enterprise', 'max_sections', 999),
    ('enterprise', 'ai_level', 3),
    ('enterprise', 'whatsapp_enabled', 1)
)
INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT p.id, cl.limit_key, cl.limit_value
FROM public.plans p
JOIN canonical_limits cl ON cl.slug = p.slug
ON CONFLICT (plan_id, limit_key) DO UPDATE
SET limit_value = EXCLUDED.limit_value;

-- ── 4. One active subscription per organization ───────────────
-- Prevent duplicate active/trialing/past_due subscriptions for a single org.
-- Historical cancelled/suspended rows can remain for audit/history.
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_live_per_org_idx
ON public.subscriptions (organization_id)
WHERE status IN ('active', 'trialing', 'past_due');

-- ── 5. Verification helper ────────────────────────────────────
-- SELECT p.slug, p.name, p.price_monthly, p.price_annual,
--        array_agg(DISTINCT pf.feature_key ORDER BY pf.feature_key) AS features
-- FROM public.plans p
-- LEFT JOIN public.plan_features pf ON pf.plan_id = p.id
-- WHERE p.slug IN ('basic','growth','advanced','enterprise')
-- GROUP BY p.slug, p.name, p.price_monthly, p.price_annual, p.sort_order
-- ORDER BY p.sort_order;
-- ============================================================
