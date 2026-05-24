-- ============================================================
-- 029 — ORG UNITS BOARD ROOT (one board node per tenant)
-- Requires 028_org_units_production.sql
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.org_units') IS NULL THEN
    RAISE NOTICE '029 skipped: org_units not found — apply 028 first';
    RETURN;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_units_one_board_per_org
  ON public.org_units (organization_id)
  WHERE unit_type = 'board';

INSERT INTO public.org_units (organization_id, unit_type, name, parent_id, sort_order, metadata)
SELECT
  o.id,
  'board',
  'مجلس الإدارة',
  NULL,
  0,
  '{"system":true,"represents":"board_members"}'::jsonb
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1
  FROM public.org_units u
  WHERE u.organization_id = o.id
    AND u.unit_type = 'board'
);

UPDATE public.org_units child
SET parent_id = board.id,
    updated_at = now()
FROM public.org_units board
WHERE board.organization_id = child.organization_id
  AND board.unit_type = 'board'
  AND child.unit_type IN ('agency', 'management', 'department', 'team')
  AND child.parent_id IS NULL
  AND child.id <> board.id;
