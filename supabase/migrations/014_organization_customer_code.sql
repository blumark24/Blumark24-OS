-- ============================================================
-- 014 — ORGANIZATION CUSTOMER CODE
-- Additive only. NO destructive changes, NO RLS changes, NO data loss.
-- Safe to run on a live database (every step is idempotent / guarded).
-- ============================================================
-- GOAL
--   Give every organization a human-friendly, stable customer number
--   (BMK-000001, BMK-000002, …) so the owner UI can show "رقم العميل"
--   instead of exposing the internal UUID. The UUID stays the primary key;
--   customer_code is an ADDITIONAL, unique, indexed identifier.
--
-- WHAT THIS DOES
--   1. organizations.customer_code  — new nullable TEXT column.
--   2. A dedicated sequence that produces the running number.
--   3. Backfill: existing rows get codes in created_at order (oldest = 000001).
--   4. BEFORE INSERT trigger that auto-assigns a code to any new org that
--      does not already carry one.
--   5. Unique index on customer_code.
--
-- WHAT THIS DOES **NOT** DO
--   • Does NOT touch the UUID primary key or any existing column/value.
--   • Does NOT change tenant-isolation or owner RLS policies.
--   • Does NOT delete or move any data.
-- ============================================================

-- ── 1. New column ───────────────────────────────────────────────────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS customer_code TEXT;

-- ── 2. Sequence that backs the running number ───────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.organizations_customer_code_seq;

-- ── 3. Backfill existing rows in creation order (oldest gets 000001) ────
-- Idempotent: only rows still missing a code are touched.
DO $$
DECLARE
  r RECORD;
BEGIN
  IF to_regclass('public.organizations') IS NULL THEN
    RAISE NOTICE '014 skipped: public.organizations not found';
    RETURN;
  END IF;

  FOR r IN
    SELECT id
    FROM public.organizations
    WHERE customer_code IS NULL OR customer_code = ''
    ORDER BY created_at, id
  LOOP
    UPDATE public.organizations
    SET customer_code =
      'BMK-' || lpad(nextval('public.organizations_customer_code_seq')::text, 6, '0')
    WHERE id = r.id;
  END LOOP;
END $$;

-- ── 4. Auto-generate on insert (additive trigger; separate from the
--       existing protect_internal_org BEFORE UPDATE/DELETE trigger) ──────
CREATE OR REPLACE FUNCTION public.set_organization_customer_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
    NEW.customer_code :=
      'BMK-' || lpad(nextval('public.organizations_customer_code_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_organization_customer_code ON public.organizations;
CREATE TRIGGER set_organization_customer_code
  BEFORE INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_customer_code();

-- ── 5. Unique, indexed identifier ───────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_customer_code
  ON public.organizations (customer_code);

-- ============================================================
-- ROLLBACK (run manually to fully revert this migration)
-- ------------------------------------------------------------
-- DROP TRIGGER IF EXISTS set_organization_customer_code ON public.organizations;
-- DROP FUNCTION IF EXISTS public.set_organization_customer_code();
-- DROP INDEX IF EXISTS public.idx_organizations_customer_code;
-- ALTER TABLE public.organizations DROP COLUMN IF EXISTS customer_code;
-- DROP SEQUENCE IF EXISTS public.organizations_customer_code_seq;
-- ============================================================
