-- 035 - Security hardening for migration 034 trigger functions.
-- Scope: REVOKE only. Function bodies, triggers, RLS policies, and data
-- are intentionally unchanged.
--
-- Reason: Supabase Security Advisor flagged the SECURITY DEFINER trigger
-- functions added by 034 as directly callable by `anon` / `authenticated`.
-- These functions are only meant to be invoked by the triggers
-- (validate / deactivate) that the database itself fires; no client should
-- be able to call them directly.

DO $$
BEGIN
  IF to_regprocedure('public.validate_executive_office_room_mapping()') IS NULL THEN
    RAISE EXCEPTION '035 requires public.validate_executive_office_room_mapping() (from migration 034)';
  END IF;

  IF to_regprocedure('public.deactivate_executive_office_department_mappings()') IS NULL THEN
    RAISE EXCEPTION '035 requires public.deactivate_executive_office_department_mappings() (from migration 034)';
  END IF;

  IF to_regprocedure('public.deactivate_executive_office_team_mappings()') IS NULL THEN
    RAISE EXCEPTION '035 requires public.deactivate_executive_office_team_mappings() (from migration 034)';
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.validate_executive_office_room_mapping()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.deactivate_executive_office_department_mappings()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.deactivate_executive_office_team_mappings()
  FROM anon, authenticated;

-- Belt-and-braces: also revoke from PUBLIC. PostgreSQL grants EXECUTE on
-- new functions to PUBLIC by default; explicitly removing it ensures no
-- future role accidentally inherits the privilege.
REVOKE EXECUTE ON FUNCTION public.validate_executive_office_room_mapping()           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deactivate_executive_office_department_mappings()  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deactivate_executive_office_team_mappings()        FROM PUBLIC;

-- The functions remain SECURITY DEFINER and continue to be invoked by
-- their BEFORE triggers because trigger execution does not consult EXECUTE
-- privileges on the function. Direct calls from a Supabase client
-- (`anon` / `authenticated`) will now fail with `42501 permission denied`.
