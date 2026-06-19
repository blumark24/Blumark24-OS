-- ============================================================
-- A3 — CANONICAL PLAN FEATURE MATRIX SYNC
-- Date: 2026-06-19
-- Scope: Professional Plan Management Engine
--
-- WHY:
--   A3 audit found a mismatch between the TypeScript plan matrix in
--   src/lib/features/packageFeatures.ts and database seed migration 020.
--
--   This is commercially risky because the UI, owner center, and runtime
--   feature checks may disagree about what each package includes.
--
-- DECISION:
--   Use src/lib/features/packageFeatures.ts as the canonical feature matrix.
--
-- CANONICAL MATRIX:
--   basic:
--     dashboard, tasks, clients, employees, reports
--
--   growth:
--     dashboard, tasks, clients, employees, reports, org, finance
--
--   advanced:
--     dashboard, tasks, clients, employees, reports, org, finance,
--     strategy, automation
--
--   enterprise:
--     dashboard, tasks, clients, employees, reports, org, finance,
--     strategy, automation, ai
--
-- SAFETY:
--   - Does not delete organizations.
--   - Does not delete subscriptions.
--   - Does not alter UI/design.
--   - Does not touch /ai implementation.
--   - Only synchronizes plan_features rows for known plan slugs.
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.plans') IS NULL THEN
    RAISE EXCEPTION 'A3 requires public.plans';
  END IF;

  IF to_regclass('public.plan_features') IS NULL THEN
    RAISE EXCEPTION 'A3 requires public.plan_features';
  END IF;
END $$;

-- Remove non-canonical feature rows for known commercial plans only.
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

-- Insert missing canonical rows.
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

-- Verification helper:
-- SELECT p.slug, array_agg(pf.feature_key ORDER BY pf.feature_key) AS features
-- FROM public.plans p
-- LEFT JOIN public.plan_features pf ON pf.plan_id = p.id
-- WHERE p.slug IN ('basic','growth','advanced','enterprise')
-- GROUP BY p.slug
-- ORDER BY p.slug;
-- ============================================================
