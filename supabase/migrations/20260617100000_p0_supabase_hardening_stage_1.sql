-- ============================================================
-- P0-SUPABASE-HARDENING — Stage 1
-- Branch: p0/supabase-hardening-stage-1
-- Date:   2026-06-17
--
-- Idempotent. No data deletion. No RLS disabled.
-- No destructive schema changes. No production application.
-- DO NOT APPLY directly — requires manual DBA approval.
-- ============================================================
-- SECURITY ISSUES ADDRESSED
--   S1. function_search_path_mutable:
--       handle_new_user, set_updated_at, get_my_role
--   S2. SECURITY DEFINER callable by anon/authenticated:
--       b24_assign_*, b24_backfill_*, b24_next_*,
--       set_current_org_id, handle_new_user
--   S3. RLS enabled without policies:
--       public."Blumark24-OS" — deny-all RESTRICTIVE policy added
-- ============================================================
-- INTENTIONALLY NOT CHANGED IN THIS STAGE
--   - current_org_id, get_my_role, can_manage_tenant_org: remain callable
--     by authenticated (required for RLS policies — cannot be removed).
--   - is_owner: remains without authenticated grant (correct, per 030).
--   - Performance: auth_rls_initplan, duplicate indexes, multiple permissive
--     policies, unindexed FKs — deferred to Stage 2.
--   - Leaked password protection: manual Supabase Auth Dashboard setting.
-- ============================================================

-- ── 1. Fix function_search_path_mutable: handle_new_user ─────────────────────
-- Migration 004 defined this with SET search_path = public.
-- Re-assert to ensure the running DB version has the fixed path.
-- Body is identical to 004. Trigger on auth.users is already installed.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    COALESCE(NEW.raw_user_meta_data->>'department', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ── 2. Fix function_search_path_mutable: set_updated_at ──────────────────────
-- Migration 019 defined without SET search_path; 024 fixed it.
-- Re-assert to ensure the path is stable regardless of apply order.
-- No SECURITY DEFINER: this trigger runs as SECURITY INVOKER (intentional).
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

-- ── 3. Fix function_search_path_mutable: get_my_role ─────────────────────────
-- Migration 008 redefined get_my_role() without SET search_path, regressing
-- the path that was fixed in 004. Re-assert the stable search_path.
-- GRANT/REVOKE state from migration 030 is preserved: authenticated can call,
-- anon/PUBLIC cannot. This is intentional — RLS policies depend on get_my_role().
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(role, 'employee')
  FROM public.profiles
  WHERE id = auth.uid();
$$;

-- ── 4. Revoke direct execute on b24_assign_* trigger functions ───────────────
-- These are BEFORE INSERT trigger functions invoked by the DB engine.
-- No user role needs EXECUTE directly: table INSERT permission is sufficient
-- to fire the trigger. Revoking direct execute does not break triggers.
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'b24_assign_organization_code()',
    'b24_assign_employee_code()',
    'b24_assign_client_code()',
    'b24_assign_task_code()',
    'b24_assign_department_code()',
    'b24_assign_invoice_code()'
  ] LOOP
    IF to_regprocedure('public.' || fn) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM anon', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM authenticated', fn);
    END IF;
  END LOOP;
END $$;

-- ── 5. Revoke direct execute on b24_backfill_* utility functions ─────────────
-- Backfill functions are admin-only migration utilities.
-- They must only be callable via service_role (which bypasses REVOKE by default).
-- Migration 033 created these without any explicit REVOKE.
DO $$
BEGIN
  IF to_regprocedure('public.b24_backfill_global_codes(regclass,text,text,integer)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.b24_backfill_global_codes(regclass, text, text, integer) FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.b24_backfill_global_codes(regclass, text, text, integer) FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.b24_backfill_global_codes(regclass, text, text, integer) FROM authenticated';
  END IF;
  IF to_regprocedure('public.b24_backfill_tenant_codes(regclass,text,text,integer)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.b24_backfill_tenant_codes(regclass, text, text, integer) FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.b24_backfill_tenant_codes(regclass, text, text, integer) FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.b24_backfill_tenant_codes(regclass, text, text, integer) FROM authenticated';
  END IF;
END $$;

-- ── 6. Revoke direct execute on b24_next_* code-sequence helpers ─────────────
-- Internal helpers called only by the b24_assign_* trigger functions.
-- No user role should call these directly.
DO $$
BEGIN
  IF to_regprocedure('public.b24_next_global_code(regclass,text,text,integer)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.b24_next_global_code(regclass, text, text, integer) FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.b24_next_global_code(regclass, text, text, integer) FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.b24_next_global_code(regclass, text, text, integer) FROM authenticated';
  END IF;
  IF to_regprocedure('public.b24_next_tenant_code(regclass,uuid,text,text,integer)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.b24_next_tenant_code(regclass, uuid, text, text, integer) FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.b24_next_tenant_code(regclass, uuid, text, text, integer) FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.b24_next_tenant_code(regclass, uuid, text, text, integer) FROM authenticated';
  END IF;
END $$;

-- ── 7. Tighten handle_new_user and set_current_org_id ────────────────────────
-- Migration 030 already revoked from PUBLIC and anon.
-- Re-assert full revoke including authenticated: trigger functions do not
-- need direct execute grants to any user role.
DO $$
BEGIN
  IF to_regprocedure('public.handle_new_user()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated';
  END IF;
  IF to_regprocedure('public.set_current_org_id()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.set_current_org_id() FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.set_current_org_id() FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.set_current_org_id() FROM authenticated';
  END IF;
END $$;

-- ── 8. Deny-all policy on public."Blumark24-OS" ──────────────────────────────
-- Table has RLS enabled but zero policies — Supabase Advisor flags this state.
-- Postgres already denies all access with no policies + RLS enabled, but an
-- explicit RESTRICTIVE deny policy makes the intent clear and silences the
-- advisor. No-op if the table does not exist in the current schema.
DO $$
BEGIN
  IF to_regclass('public."Blumark24-OS"') IS NOT NULL THEN
    DROP POLICY IF EXISTS "p0_deny_all" ON public."Blumark24-OS";
    CREATE POLICY "p0_deny_all"
      ON public."Blumark24-OS"
      AS RESTRICTIVE
      FOR ALL
      TO PUBLIC
      USING (false)
      WITH CHECK (false);
    RAISE NOTICE 'P0: deny-all RESTRICTIVE policy applied to public."Blumark24-OS"';
  ELSE
    RAISE NOTICE 'P0: public."Blumark24-OS" not found — policy step skipped (safe)';
  END IF;
END $$;

-- ============================================================
-- MANUAL ACTIONS REQUIRED (not addressable in SQL migration)
-- ============================================================
-- 1. Leaked password protection:
--    Supabase Dashboard → Authentication → Providers → Email
--    Enable "Leaked password protection" (HaveIBeenPwned check).
--
-- 2. Performance issues deferred to Stage 2:
--    auth_rls_initplan — requires wrapping RLS policies with (SELECT ...)
--    multiple permissive policies — requires policy consolidation review
--    duplicate indexes — requires index audit
--    unindexed foreign keys — requires FK index additions
-- ============================================================
