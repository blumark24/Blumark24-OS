-- ============================================================
-- A3-B — FIX ENTERPRISE PLAN LIMITS SENTINEL
-- Date: 2026-06-19
-- Scope: Plans / Limits
--
-- WHY:
--   Migration A3 set enterprise structure limits to -1 as an
--   "unlimited" sentinel value. The runtime check in
--   checkCanAddStructureLevel() uses `current >= cap`, which means
--   -1 always blocks structure creation (any count >= -1 is true).
--
--   This patch replaces -1 with 999 for the four structure-cap keys,
--   matching the client-side PLAN_STRUCTURE_CAPS fallback for enterprise
--   in src/lib/org/orgPackageLimits.ts.
--
-- WHAT THIS DOES:
--   Updates plan_limits rows for enterprise plan where limit_value = -1
--   and limit_key is one of the four structure caps.
--   Only touches rows that still hold the erroneous -1 value (idempotent).
--
-- WHAT THIS DOES NOT DO:
--   - Does not touch plan_features.
--   - Does not touch subscriptions.
--   - Does not touch /ai.
--   - Does not touch billing or payments.
--   - Does not delete any data.
--   - Does not change ai_level or whatsapp_enabled.
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.plan_limits') IS NULL THEN
    RAISE EXCEPTION 'A3-B requires public.plan_limits';
  END IF;

  IF to_regclass('public.plans') IS NULL THEN
    RAISE EXCEPTION 'A3-B requires public.plans';
  END IF;
END $$;

-- Fix enterprise structure cap limits: replace -1 sentinel with 999.
UPDATE public.plan_limits pl
SET limit_value = 999
FROM public.plans p
WHERE pl.plan_id = p.id
  AND p.slug = 'enterprise'
  AND pl.limit_key IN ('max_employees', 'max_agencies', 'max_departments', 'max_sections')
  AND pl.limit_value = -1;

-- ── Verification helper ───────────────────────────────────────
-- Run after applying. Expect all four rows to show limit_value = 999.
--
-- SELECT p.slug, pl.limit_key, pl.limit_value
-- FROM public.plan_limits pl
-- JOIN public.plans p ON p.id = pl.plan_id
-- WHERE p.slug = 'enterprise'
--   AND pl.limit_key IN ('max_employees', 'max_agencies', 'max_departments', 'max_sections')
-- ORDER BY pl.limit_key;
--
-- Expected:
--   slug       | limit_key        | limit_value
--   -----------+------------------+------------
--   enterprise | max_agencies     | 999
--   enterprise | max_departments  | 999
--   enterprise | max_employees    | 999
--   enterprise | max_sections     | 999
-- ============================================================
