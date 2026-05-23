-- ============================================================
-- 022 — TENANT AUTOMATION ENGINE (Zapier-style workflows)
-- Triggers, conditions, actions per organization. Does not replace legacy automations table.
-- ============================================================

DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '022 requires public.current_org_id() — apply migration 011 first';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.can_manage_automation_workflows()
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
      'defense_manager',
      'board_member',
      'attack_manager',
      'finance_manager'
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_automation_workflows() TO authenticated;

-- ── Workflows (trigger + conditions + actions as JSON) ────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by_name text NOT NULL DEFAULT '',
  run_count integer NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_workflows_org ON public.automation_workflows (organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_trigger ON public.automation_workflows (organization_id, trigger_type);

-- ── Execution log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.automation_workflows(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'failed', 'skipped')),
  trigger_event text NOT NULL DEFAULT '',
  trigger_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_runs_workflow ON public.automation_runs (workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_org ON public.automation_runs (organization_id, created_at DESC);

-- ── Triggers ────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t text;
BEGIN
  IF to_regprocedure('public.set_updated_at()') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS set_automation_workflows_updated_at ON public.automation_workflows;
    CREATE TRIGGER set_automation_workflows_updated_at
      BEFORE UPDATE ON public.automation_workflows
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  FOREACH t IN ARRAY ARRAY['automation_workflows', 'automation_runs'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_org_id ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER set_org_id BEFORE INSERT ON public.%I '
      || 'FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id()', t
    );
  END LOOP;
END $$;

-- ── RLS ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t text;
  pol text;
BEGIN
  FOREACH t IN ARRAY ARRAY['automation_workflows', 'automation_runs'] LOOP
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
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_automation_workflows()))',
      pol, t
    );

    pol := t || ': org update';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_automation_workflows())) '
      || 'WITH CHECK ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_automation_workflows()))',
      pol, t
    );

    pol := t || ': org delete';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_automation_workflows()))',
      pol, t
    );
  END LOOP;
END $$;

-- Runs: allow insert from authenticated org (engine logs via user session or service)
DO $$
BEGIN
  DROP POLICY IF EXISTS "automation_runs: org insert log" ON public.automation_runs;
  CREATE POLICY "automation_runs: org insert log" ON public.automation_runs
    FOR INSERT WITH CHECK (
      public.is_owner()
      OR public.get_my_role() = 'super_admin'
      OR organization_id = public.current_org_id()
    );
END $$;
