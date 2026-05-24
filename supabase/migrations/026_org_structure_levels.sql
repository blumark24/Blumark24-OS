-- ============================================================
-- 026 — ORG STRUCTURE LEVELS (package-aware hierarchy)
-- Additive. Safe after 019. No RLS changes.
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.departments') IS NULL THEN
    RAISE EXCEPTION '026 requires migration 019 (departments)';
  END IF;
END $$;

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS structure_level text NOT NULL DEFAULT 'department';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'departments_structure_level_check'
  ) THEN
    ALTER TABLE public.departments
      ADD CONSTRAINT departments_structure_level_check
      CHECK (structure_level IN ('agency', 'management', 'department'));
  END IF;
END $$;

UPDATE public.departments
SET structure_level = 'department'
WHERE structure_level IS NULL OR structure_level = '';

CREATE INDEX IF NOT EXISTS idx_departments_structure_level
  ON public.departments (organization_id, structure_level);
