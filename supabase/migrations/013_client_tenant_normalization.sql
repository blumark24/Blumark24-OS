-- ============================================================
-- 013 — CLIENT TENANT NORMALIZATION
-- Additive + safe repair. NO destructive deletes, NO data loss.
-- Safe to run on a live database (every step is idempotent / guarded).
-- ============================================================
-- GOAL
--   Make every visible customer organization behave as a normal, editable
--   client tenant, while keeping the internal Blumark24 admin organization
--   clearly separate and protected from customer-management actions.
--
-- WHAT THIS DOES
--   1. organizations.is_internal  — a real data attribute that replaces the
--      hard-coded `slug = 'blumark24-internal'` checks scattered in the app.
--      Any org with is_internal = false is a normal customer tenant.
--   2. organizations.deleted_at   — soft-delete marker. "Delete tenant" in the
--      owner UI sets this (+ status='cancelled'); rows are RETAINED and can be
--      restored by clearing the column. No cascading hard delete.
--   3. Classifies the existing internal seed org (slug='blumark24-internal')
--      as is_internal = true. This is one-time seed maintenance, not a runtime
--      name exception — from here the app keys off is_internal only.
--   4. Repair: pins platform-owner + super_admin profiles to the internal org
--      so an internal admin can never be tied to a deletable customer tenant.
--   5. Safety backfill: any org-less clients/tasks/employees → internal org so
--      nothing becomes invisible under Phase B.1 isolation (idempotent).
--   6. A BEFORE UPDATE/DELETE trigger that blocks suspending, cancelling,
--      soft-deleting, hard-deleting, or un-flagging an internal org — a DB-level
--      safety net behind the owner UI guards.
--
-- WHAT THIS DOES **NOT** DO
--   • Does NOT delete or move any customer data.
--   • Does NOT change tenant-isolation policies (Phase B.1 stays intact).
--   • Does NOT change auth, owner login routing, or the UI.
-- ============================================================

-- ── 1. New columns on organizations ────────────────────────────────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at
  ON public.organizations (deleted_at);

-- ── 2. Classify internal org + repair profiles & operational rows ──────
DO $$
DECLARE
  v_internal UUID;
BEGIN
  IF to_regclass('public.organizations') IS NULL THEN
    RAISE NOTICE '013 skipped: public.organizations not found';
    RETURN;
  END IF;

  -- One-time classification of the seed internal org. After this the app uses
  -- is_internal, never the slug, to decide what is internal vs. a customer.
  UPDATE public.organizations
  SET is_internal = true
  WHERE slug = 'blumark24-internal';

  SELECT id INTO v_internal
  FROM public.organizations
  WHERE is_internal = true
  ORDER BY created_at
  LIMIT 1;

  IF v_internal IS NULL THEN
    RAISE NOTICE '013: no internal organization found — profile/data repair skipped';
    RETURN;
  END IF;

  -- Keep platform-owner + super_admin accounts on the internal org so an
  -- internal admin is never linked to a deletable customer tenant. Client
  -- tenant logins (role 'employee', linked to their own org) are untouched.
  IF to_regclass('public.profiles') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'profiles'
         AND column_name = 'organization_id'
     )
  THEN
    UPDATE public.profiles
    SET organization_id = v_internal
    WHERE (
            role = 'super_admin'
            OR lower(email) IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
          )
      AND organization_id IS DISTINCT FROM v_internal;
  END IF;

  -- Safety backfill: org-less operational rows → internal org (idempotent,
  -- NULL-only) so existing data never disappears under Phase B.1 isolation.
  IF to_regclass('public.clients') IS NOT NULL THEN
    UPDATE public.clients   SET organization_id = v_internal WHERE organization_id IS NULL;
  END IF;
  IF to_regclass('public.tasks') IS NOT NULL THEN
    UPDATE public.tasks     SET organization_id = v_internal WHERE organization_id IS NULL;
  END IF;
  IF to_regclass('public.employees') IS NOT NULL THEN
    UPDATE public.employees SET organization_id = v_internal WHERE organization_id IS NULL;
  END IF;
END $$;

-- ── 3. Protect internal organizations (DB-level safety net) ────────────
-- Blocks the destructive transitions even if a future caller bypasses the UI.
-- Allows ordinary edits (name, owner_email, plan_id, notes) on the internal org.
CREATE OR REPLACE FUNCTION public.protect_internal_organization()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_internal THEN
      RAISE EXCEPTION 'Internal organizations cannot be deleted (org %)', OLD.id;
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE
  IF OLD.is_internal AND (
       NEW.is_internal = false
       OR NEW.deleted_at IS NOT NULL
       OR NEW.status IN ('suspended', 'cancelled')
     ) THEN
    RAISE EXCEPTION
      'Internal organizations cannot be suspended, cancelled, soft-deleted, or un-flagged (org %)',
      OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_internal_org ON public.organizations;
CREATE TRIGGER protect_internal_org
  BEFORE UPDATE OR DELETE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.protect_internal_organization();

-- ============================================================
-- ROLLBACK (run manually to fully revert this migration)
-- ------------------------------------------------------------
-- DROP TRIGGER IF EXISTS protect_internal_org ON public.organizations;
-- DROP FUNCTION IF EXISTS public.protect_internal_organization();
-- ALTER TABLE public.organizations DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE public.organizations DROP COLUMN IF EXISTS is_internal;
-- -- The profile/operational-row repairs are non-destructive backfills and do
-- -- not need reverting (they only set organization_id where it was NULL or on
-- -- internal-admin accounts). No customer data was moved or deleted.
-- ============================================================
