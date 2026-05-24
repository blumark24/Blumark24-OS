-- ============================================================
-- 024 — TENANT WORKSPACE SETTINGS + organization_manager RBAC
-- Tenant managers get per-org preferences (not global system_settings).
-- ============================================================

DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '024 requires public.current_org_id() — apply migration 011 first';
  END IF;
  IF to_regclass('public.organizations') IS NULL THEN
    RAISE EXCEPTION '024 requires public.organizations — apply migration 009 first';
  END IF;
END $$;

-- ── 1. Per-tenant workspace settings (company prefs, not platform) ───────────
CREATE TABLE IF NOT EXISTS public.tenant_workspace_settings (
  organization_id UUID PRIMARY KEY
    REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  notifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  appearance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_tenant_workspace_settings_updated_at ON public.tenant_workspace_settings;
CREATE TRIGGER set_tenant_workspace_settings_updated_at
  BEFORE UPDATE ON public.tenant_workspace_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ensure can_manage_tenant_org exists (from 021; defined here if 021 not applied yet)
CREATE OR REPLACE FUNCTION public.can_manage_tenant_org()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR public.get_my_role() = 'organization_manager'
    OR public.get_my_role() = 'board_member';
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_tenant_org() TO authenticated;

ALTER TABLE public.tenant_workspace_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_workspace_settings: org select" ON public.tenant_workspace_settings;
CREATE POLICY "tenant_workspace_settings: org select"
  ON public.tenant_workspace_settings FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "tenant_workspace_settings: org upsert" ON public.tenant_workspace_settings;
CREATE POLICY "tenant_workspace_settings: org insert"
  ON public.tenant_workspace_settings FOR INSERT
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id = public.current_org_id()
      AND public.can_manage_tenant_org()
    )
  );

CREATE POLICY "tenant_workspace_settings: org update"
  ON public.tenant_workspace_settings FOR UPDATE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id = public.current_org_id()
      AND public.can_manage_tenant_org()
    )
  )
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id = public.current_org_id()
      AND public.can_manage_tenant_org()
    )
  );

-- ── 2. organization_manager: full tenant workspace permissions (UI matrix) ───
DO $$
BEGIN
  IF to_regclass('public.role_permissions') IS NULL THEN
    RAISE NOTICE '024: role_permissions missing — seed skipped';
    RETURN;
  END IF;

  INSERT INTO public.role_permissions (role, permissions) VALUES
    (
      'organization_manager',
      ARRAY[
        'view_dashboard',
        'view_employees',
        'manage_users',
        'manage_tasks',
        'manage_clients',
        'manage_finance',
        'manage_reports',
        'manage_tenant_settings',
        'manage_board'
      ]
    )
  ON CONFLICT (role) DO UPDATE
    SET permissions = EXCLUDED.permissions;
END $$;
