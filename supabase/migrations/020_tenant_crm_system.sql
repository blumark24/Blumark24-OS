-- ============================================================
-- 020 — TENANT CRM (deals pipeline, notes, reminders, contracts, activities, revenue)
-- Additive. Tenant-isolated via organization_id + RLS.
-- ============================================================

DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '020 requires public.current_org_id() — apply migration 011 first';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.can_manage_crm()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_owner()
    OR public.get_my_role() IN (
      'super_admin',
      'organization_manager',
      'attack_manager',
      'board_member',
      'defense_manager'
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_crm() TO authenticated;

-- ── Pipeline stages ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#22d3ee',
  is_closed_won boolean NOT NULL DEFAULT false,
  is_closed_lost boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_crm_stages_org ON public.crm_pipeline_stages (organization_id);

-- ── Deals ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.crm_pipeline_stages(id) ON DELETE RESTRICT,
  title text NOT NULL,
  value numeric(14,2) NOT NULL DEFAULT 0,
  expected_close_date date,
  assigned_name text NOT NULL DEFAULT '',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_org ON public.crm_deals (organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_client ON public.crm_deals (client_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON public.crm_deals (stage_id);

-- ── Client notes (structured, separate from clients.notes) ────────────────────
CREATE TABLE IF NOT EXISTS public.crm_client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  body text NOT NULL,
  author_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_notes_client ON public.crm_client_notes (client_id);

-- ── Reminders ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  title text NOT NULL,
  due_at timestamptz NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_reminders_due ON public.crm_reminders (organization_id, due_at);

-- ── Contracts ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  title text NOT NULL,
  package_type text NOT NULL DEFAULT 'صغيرة',
  contract_value numeric(14,2) NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'مسودة'
    CHECK (status IN ('مسودة', 'نشط', 'منتهي', 'ملغي')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_contracts_client ON public.crm_contracts (client_id);

-- ── Activity timeline ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  activity_type text NOT NULL DEFAULT 'note'
    CHECK (activity_type IN (
      'note','call','meeting','email','deal','task','reminder','contract','revenue','status','package'
    )),
  title text NOT NULL,
  body text,
  meta jsonb NOT NULL DEFAULT '{}',
  author_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_client ON public.crm_activities (client_id, created_at DESC);

-- ── Revenue tracking ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crm_revenue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.crm_contracts(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL,
  event_type text NOT NULL DEFAULT 'payment'
    CHECK (event_type IN ('deal_won','contract','payment','adjustment')),
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_revenue_org ON public.crm_revenue_events (organization_id, recorded_at DESC);

-- ── Triggers: updated_at + org stamp ──────────────────────────────────────────
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'crm_deals','crm_contracts'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%s_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%I '
      || 'FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t
    );
  END LOOP;

  FOREACH t IN ARRAY ARRAY[
    'crm_pipeline_stages','crm_deals','crm_client_notes','crm_reminders',
    'crm_contracts','crm_activities','crm_revenue_events'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_org_id ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER set_org_id BEFORE INSERT ON public.%I '
      || 'FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id()', t
    );
  END LOOP;
END $$;

-- ── RLS helper macro (per table) ──────────────────────────────────────────────
DO $$
DECLARE
  t text;
  pol text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'crm_pipeline_stages','crm_deals','crm_client_notes','crm_reminders',
    'crm_contracts','crm_activities','crm_revenue_events'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    pol := t || ': org select';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING ('
      || 'organization_id = public.current_org_id() '
      || 'OR public.is_owner() OR public.get_my_role() = ''super_admin'')',
      pol, t
    );

    pol := t || ': org insert';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_crm()))',
      pol, t
    );

    pol := t || ': org update';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_crm())) '
      || 'WITH CHECK ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_crm()))',
      pol, t
    );

    pol := t || ': org delete';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_crm()))',
      pol, t
    );
  END LOOP;
END $$;
