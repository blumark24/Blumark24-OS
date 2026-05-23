-- ============================================================
-- 023 — NOTIFICATIONS TENANT ISOLATION
-- Fixes cross-tenant leakage: legacy policies allowed any authenticated
-- user to read broadcast rows (user_id IS NULL) from all organizations.
-- Apply AFTER 011 (organization_id columns) and BEFORE/AFTER 021 as needed.
-- ============================================================

DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '023 requires public.current_org_id() — apply migration 011 first';
  END IF;
  IF to_regclass('public.notifications') IS NULL THEN
    RAISE EXCEPTION '023 requires public.notifications';
  END IF;
END $$;

-- ── 1. organization_id column (idempotent) ───────────────────────────────────
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS organization_id UUID
  REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_organization_id
  ON public.notifications (organization_id);

CREATE INDEX IF NOT EXISTS idx_notifications_org_user_created
  ON public.notifications (organization_id, user_id, created_at DESC);

-- ── 2. Backfill ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_internal UUID;
BEGIN
  SELECT id INTO v_internal
  FROM public.organizations
  WHERE is_internal = true
  ORDER BY created_at
  LIMIT 1;

  IF v_internal IS NULL THEN
    SELECT id INTO v_internal FROM public.organizations ORDER BY created_at LIMIT 1;
  END IF;

  -- Stamp from profile when notification targets a user
  UPDATE public.notifications n
  SET organization_id = p.organization_id
  FROM public.profiles p
  WHERE n.organization_id IS NULL
    AND n.user_id IS NOT NULL
    AND p.id = n.user_id
    AND p.organization_id IS NOT NULL;

  -- Legacy broadcast rows (user_id NULL) → internal org only
  IF v_internal IS NOT NULL THEN
    UPDATE public.notifications
    SET organization_id = v_internal
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- ── 3. Drop ALL legacy permissive policies (root cause of leakage) ───────────
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ── 4. Org-scoped policies (single source of truth) ─────────────────────────
CREATE POLICY "notifications: org select" ON public.notifications FOR SELECT
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id = public.current_org_id()
      AND (user_id IS NULL OR user_id = auth.uid())
    )
  );

CREATE POLICY "notifications: org insert" ON public.notifications FOR INSERT
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR organization_id = public.current_org_id()
  );

CREATE POLICY "notifications: org update" ON public.notifications FOR UPDATE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id = public.current_org_id()
      AND (user_id IS NULL OR user_id = auth.uid())
    )
  )
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR organization_id = public.current_org_id()
  );

CREATE POLICY "notifications: org delete" ON public.notifications FOR DELETE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR organization_id = public.current_org_id()
  );

-- ── 5. Auto-stamp organization_id on insert ─────────────────────────────────
DROP TRIGGER IF EXISTS set_org_id ON public.notifications;
CREATE TRIGGER set_org_id
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id();
