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

CREATE OR REPLACE FUNCTION public.current_org_is_internal()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
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
$$;

-- Callable by signed-in clients (customer tenants included) via supabase.rpc.
GRANT EXECUTE ON FUNCTION public.current_org_is_internal() TO authenticated;

-- ============================================================
-- ROLLBACK
-- ------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.current_org_is_internal();
-- ============================================================
