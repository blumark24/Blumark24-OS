-- ============================================================
-- 011 — TENANT ISOLATION · PHASE A (PREPARATION ONLY)
-- Additive only. ZERO behavior change. Safe to run on a live DB.
-- ============================================================
-- WHAT THIS DOES
--   1. Adds a nullable organization_id (FK → organizations) to every
--      operational table that feeds the client dashboard and lacks it.
--   2. Indexes each new organization_id column.
--   3. Backfills all existing rows (and existing internal staff profiles)
--      to the Blumark24 internal organization (slug = 'blumark24-internal').
--   4. Adds the helper public.current_org_id() for use by Phase B policies.
--
-- WHAT THIS DOES **NOT** DO  (deliberately — Phase B will, separately)
--   • Does NOT create, drop, or alter ANY RLS policy.
--   • Does NOT enforce tenant scoping anywhere — every existing policy is
--     left exactly as-is, so the dashboard keeps showing the same rows.
--   • Does NOT change application queries or UI.
--
-- After this migration the data is *labelled* by organization but nothing
-- reads or enforces that label yet. Enforcement is a later, separate PR.
-- Re-runnable: IF NOT EXISTS guards + IS NULL backfill conditions.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Add nullable organization_id + index to each operational table.
--    ON DELETE SET NULL so removing an organization never deletes data.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.clients         ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_clients_organization_id         ON public.clients (organization_id);

ALTER TABLE public.tasks           ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id           ON public.tasks (organization_id);

ALTER TABLE public.employees       ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_employees_organization_id       ON public.employees (organization_id);

ALTER TABLE public.transactions    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_organization_id    ON public.transactions (organization_id);

ALTER TABLE public.invoices        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id        ON public.invoices (organization_id);

ALTER TABLE public.expenses        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_organization_id        ON public.expenses (organization_id);

ALTER TABLE public.activities      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_activities_organization_id      ON public.activities (organization_id);

ALTER TABLE public.projects        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_organization_id        ON public.projects (organization_id);

ALTER TABLE public.strategy_phases ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_strategy_phases_organization_id ON public.strategy_phases (organization_id);

ALTER TABLE public.board_members   ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_board_members_organization_id   ON public.board_members (organization_id);

ALTER TABLE public.automations     ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_automations_organization_id     ON public.automations (organization_id);

ALTER TABLE public.automation_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_automation_logs_organization_id ON public.automation_logs (organization_id);

ALTER TABLE public.messages        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_messages_organization_id        ON public.messages (organization_id);

-- notifications is already per-user scoped (user_id = auth.uid() OR broadcast),
-- not global. Adding organization_id is still safe and additive — included so
-- Phase B can optionally scope broadcasts per organization.
ALTER TABLE public.notifications   ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id   ON public.notifications (organization_id);

-- ─────────────────────────────────────────────────────────────
-- 2. Helper: current_org_id()
--    Returns the caller's organization from profiles. SECURITY DEFINER so it
--    can be used inside Phase B RLS policies without recursion. Not referenced
--    by any policy yet — defined now so Phase B is a pure policy swap.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Backfill existing data → Blumark24 internal organization.
--    Only touches rows whose organization_id IS NULL, so:
--      • it is idempotent (re-running is a no-op for already-labelled rows), and
--      • it never overwrites a client login's organization (those are already
--        set by the create-client-login flow).
--    If the internal organization is missing, the backfill is skipped cleanly.
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_internal UUID;
BEGIN
  SELECT id INTO v_internal
  FROM public.organizations
  WHERE slug = 'blumark24-internal'
  LIMIT 1;

  IF v_internal IS NULL THEN
    RAISE NOTICE 'Phase A backfill skipped: organization slug=blumark24-internal not found';
    RETURN;
  END IF;

  UPDATE public.clients         SET organization_id = v_internal WHERE organization_id IS NULL;
  UPDATE public.tasks           SET organization_id = v_internal WHERE organization_id IS NULL;
  UPDATE public.employees       SET organization_id = v_internal WHERE organization_id IS NULL;
  UPDATE public.transactions    SET organization_id = v_internal WHERE organization_id IS NULL;
  UPDATE public.invoices        SET organization_id = v_internal WHERE organization_id IS NULL;
  UPDATE public.expenses        SET organization_id = v_internal WHERE organization_id IS NULL;
  UPDATE public.activities      SET organization_id = v_internal WHERE organization_id IS NULL;
  UPDATE public.projects        SET organization_id = v_internal WHERE organization_id IS NULL;
  UPDATE public.strategy_phases SET organization_id = v_internal WHERE organization_id IS NULL;
  UPDATE public.board_members   SET organization_id = v_internal WHERE organization_id IS NULL;
  UPDATE public.automations     SET organization_id = v_internal WHERE organization_id IS NULL;
  UPDATE public.automation_logs SET organization_id = v_internal WHERE organization_id IS NULL;
  UPDATE public.messages        SET organization_id = v_internal WHERE organization_id IS NULL;
  UPDATE public.notifications   SET organization_id = v_internal WHERE organization_id IS NULL;

  -- Existing internal staff/owner profiles only. Client logins created via
  -- create-client-login already have their organization_id set, so the
  -- IS NULL condition leaves them untouched.
  UPDATE public.profiles        SET organization_id = v_internal WHERE organization_id IS NULL;
END $$;
