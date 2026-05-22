-- ============================================================
-- 016 — HELPER: current_org_is_internal()
-- Additive only. NO RLS changes, NO data changes.
-- Safe to run on a live database (idempotent).
-- ============================================================
-- WHY
--   The /org page must render the internal Blumark24 department/agency
--   scaffold ONLY for users who belong to the internal organization, and
--   a neutral empty state for every customer tenant. The organizations
--   table is owner-only under RLS (migration 009), so a customer tenant
--   cannot read organizations.is_internal directly. This SECURITY DEFINER
--   helper exposes exactly one boolean about the CALLER'S OWN org and
--   nothing else — it does not grant any access to the organizations table
--   and does not weaken tenant isolation.
--
-- BEHAVIOR
--   Returns true  → the caller's profiles.organization_id points to an
--                   organization with is_internal = true (internal staff).
--   Returns false → customer tenant, no org, or org not found (safe default
--                   so the internal scaffold is never shown to a tenant).
--
-- DEPENDENCIES
--   • organizations.is_internal (013)   • profiles.organization_id (010)
-- ============================================================

-- Guarded: with check_function_bodies ON (the default), CREATE FUNCTION
-- validates the referenced tables/columns at creation time. If a minimal
-- schema is missing organizations.is_internal or profiles.organization_id,
-- we install a safe fallback that always returns false (so the /org page
-- treats everyone as a customer tenant and never leaks the internal scaffold).
DO $$
BEGIN
  IF to_regclass('public.organizations') IS NOT NULL
     AND to_regclass('public.profiles') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='organizations' AND column_name='is_internal'
     )
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='profiles' AND column_name='organization_id'
     )
  THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.current_org_is_internal()
      RETURNS boolean
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      SET search_path = public
      AS $body$
        SELECT COALESCE(
          (
            SELECT o.is_internal
            FROM public.profiles p
            JOIN public.organizations o ON o.id = p.organization_id
            WHERE p.id = auth.uid()
            LIMIT 1
          ),
          false
        );
      $body$;
    $fn$;
  ELSE
    RAISE NOTICE '016: organizations.is_internal / profiles.organization_id missing — installing false-returning fallback';
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.current_org_is_internal()
      RETURNS boolean
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      SET search_path = public
      AS $body$
        SELECT false;
      $body$;
    $fn$;
  END IF;
END $$;

-- Callable by signed-in clients (customer tenants included) via supabase.rpc.
GRANT EXECUTE ON FUNCTION public.current_org_is_internal() TO authenticated;

-- ============================================================
-- ROLLBACK
-- ------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.current_org_is_internal();
-- ============================================================
