-- ============================================================
-- C1 — DATABASE SECURITY HARDENING
-- Addresses Supabase advisor findings:
--   1. SECURITY DEFINER functions callable by authenticated users
--   2. RLS performance: auth.uid() / auth.role() per-row calls
--   3. Multiple permissive policies (redundant profiles: owner select)
--
-- SAFETY RULES (all applied):
--   • No table drops, no data deletes, no schema changes
--   • No broad PUBLIC access introduced
--   • Every DROP POLICY paired with an equivalent CREATE POLICY
--   • All blocks guarded by IF to_regclass / to_regprocedure IS NOT NULL
--   • Tenant isolation semantics preserved exactly
--   • Owner access preserved exactly
--
-- MANUAL ACTION REQUIRED (cannot be done in SQL):
--   • Supabase Dashboard → Authentication → Security → Enable "Leaked Password
--     Protection". This feature is only configurable via the Supabase dashboard
--     and has no SQL equivalent.
-- ============================================================

-- ── A. SECURITY DEFINER function access hardening ─────────────────────────────
--
-- Migration 030 revoked EXECUTE on is_owner() from PUBLIC and anon but did
-- NOT regrant to authenticated. Because RLS policy expressions run in the
-- caller's security context, authenticated users need EXECUTE on functions
-- that appear in policies they evaluate.
--
-- Findings:
--   • is_owner()          — revoked from PUBLIC/anon in 030, no authenticated
--                           grant. Any table with `USING (public.is_owner())`
--                           in its policy is affected. Grant explicitly.
--   • get_my_role()       — already granted to authenticated in 030. ✅
--   • current_org_id()    — already granted to authenticated in 030. ✅
--   • can_manage_tenant_org() — already granted in 030. ✅
--   • current_org_is_internal() — intentionally revoked from authenticated
--                           in 030 (not used in tenant-facing policies). Leave.
--
-- Action: Grant EXECUTE on is_owner() to authenticated only.
-- Anon and PUBLIC remain revoked (existing 030 state preserved).

DO $$
BEGIN
  IF to_regprocedure('public.is_owner()') IS NOT NULL THEN
    -- Ensure anon/public cannot call this function directly
    REVOKE ALL ON FUNCTION public.is_owner() FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.is_owner() FROM anon;
    -- Allow authenticated users to evaluate RLS policies that call is_owner()
    GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;
  END IF;
END $$;

-- ── B. RLS performance: replace per-row auth function calls ──────────────────
--
-- auth.uid() and auth.role() called directly in a USING / WITH CHECK clause
-- are re-evaluated for every row scanned. Wrapping them in a sub-SELECT
-- (e.g., `(select auth.uid())`) causes PostgreSQL to evaluate the expression
-- once per statement, acting as an InitPlan that is cached for the lifetime
-- of the query. This can dramatically improve performance on large tables.
--
-- Tables affected:
--   • profiles       — auth.uid() in select / insert / update policies
--   • notifications  — auth.uid() in select / update policies
--   • plan_limits    — auth.uid() inside EXISTS subquery
--   • role_permissions — auth.role() in read policy
--
-- Semantics are preserved exactly; only the evaluation strategy changes.

-- ── B1. profiles ─────────────────────────────────────────────────────────────
-- Current policies (set by a1_production_rls_legacy_policy_cleanup):
--   "profiles: select"     — auth.uid() = id
--   "profiles: insert own" — auth.uid() = id
--   "profiles: update"     — auth.uid() = id
--   "profiles: owner select" — public.is_owner()  ← redundant; covered above
--
-- Dropping "profiles: owner select" (redundant permissive policy):
--   "profiles: select" already contains OR public.is_owner(), so having a
--   second permissive SELECT policy that only checks is_owner() is superfluous.
--   PostgreSQL evaluates permissive policies with OR; removing the duplicate
--   has zero effect on who can read what.

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN RETURN; END IF;

  -- Remove redundant owner select (covered by "profiles: select")
  DROP POLICY IF EXISTS "profiles: owner select" ON public.profiles;

  -- Recreate policies with (select auth.uid()) for per-query evaluation
  DROP POLICY IF EXISTS "profiles: select" ON public.profiles;
  CREATE POLICY "profiles: select"
    ON public.profiles FOR SELECT
    USING (
      (select auth.uid()) = id
      OR public.is_owner()
      OR public.get_my_role() = 'super_admin'
      OR (
        organization_id IS NOT NULL
        AND organization_id = public.current_org_id()
      )
    );

  DROP POLICY IF EXISTS "profiles: insert own" ON public.profiles;
  CREATE POLICY "profiles: insert own"
    ON public.profiles FOR INSERT
    WITH CHECK ((select auth.uid()) = id);

  DROP POLICY IF EXISTS "profiles: update" ON public.profiles;
  CREATE POLICY "profiles: update"
    ON public.profiles FOR UPDATE
    USING      ((select auth.uid()) = id OR public.get_my_role() IN ('super_admin') OR public.is_owner())
    WITH CHECK ((select auth.uid()) = id OR public.get_my_role() IN ('super_admin') OR public.is_owner());

  -- "profiles: delete" uses only get_my_role()/is_owner() — already safe, no change needed
END $$;

-- ── B2. notifications ─────────────────────────────────────────────────────────
-- Policies set by 023_notifications_tenant_isolation:
--   "notifications: org select" — user_id IS NULL OR user_id = auth.uid()
--   "notifications: org update" — user_id IS NULL OR user_id = auth.uid()
-- These use auth.uid() per-row. Replace with (select auth.uid()).

DO $$
BEGIN
  IF to_regclass('public.notifications') IS NULL THEN RETURN; END IF;

  DROP POLICY IF EXISTS "notifications: org select" ON public.notifications;
  CREATE POLICY "notifications: org select"
    ON public.notifications FOR SELECT
    USING (
      organization_id = public.current_org_id()
      AND (user_id IS NULL OR user_id = (select auth.uid()))
    );

  DROP POLICY IF EXISTS "notifications: org update" ON public.notifications;
  CREATE POLICY "notifications: org update"
    ON public.notifications FOR UPDATE
    USING (
      organization_id = public.current_org_id()
      AND (user_id IS NULL OR user_id = (select auth.uid()))
    )
    WITH CHECK (
      organization_id = public.current_org_id()
      AND (user_id IS NULL OR user_id = (select auth.uid()))
    );
END $$;

-- ── B3. plan_limits — tenant read subquery ────────────────────────────────────
-- Policy "plan_limits: tenant read own plan" (set by 030) uses:
--   WHERE p.id = auth.uid()
-- inside an EXISTS subquery. Replace with (select auth.uid()).

DO $$
BEGIN
  IF to_regclass('public.plan_limits') IS NULL THEN RETURN; END IF;

  DROP POLICY IF EXISTS "plan_limits: tenant read own plan" ON public.plan_limits;
  CREATE POLICY "plan_limits: tenant read own plan"
    ON public.plan_limits FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.organizations o
        JOIN public.profiles p ON p.organization_id = o.id
        WHERE p.id = (select auth.uid())
          AND o.plan_id = plan_limits.plan_id
          AND o.deleted_at IS NULL
      )
      OR public.is_owner()
      OR public.get_my_role() = 'super_admin'
    );
END $$;

-- ── B4. role_permissions — auth.role() per-row ───────────────────────────────
-- Policy "role_permissions: read" uses auth.role() = 'authenticated'.
-- auth.role() returns the PostgreSQL role name for the current connection.
-- Wrap in (select auth.role()) for per-query evaluation.
-- NOTE: this table is intentionally NOT org-scoped (global system table).

DO $$
BEGIN
  IF to_regclass('public.role_permissions') IS NULL THEN RETURN; END IF;

  DROP POLICY IF EXISTS "role_permissions: read" ON public.role_permissions;
  CREATE POLICY "role_permissions: read"
    ON public.role_permissions FOR SELECT
    USING ((select auth.role()) = 'authenticated');
END $$;

-- ── C. Verification queries (run read-only after applying) ───────────────────
--
-- C1. Confirm is_owner() EXECUTE grants:
--   SELECT grantee, privilege_type
--   FROM information_schema.role_routine_grants
--   WHERE routine_name = 'is_owner' AND routine_schema = 'public';
--   -- Expected: authenticated = EXECUTE, anon/PUBLIC = absent
--
-- C2. Confirm profiles policies are correctly named:
--   SELECT policyname, cmd, qual
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'profiles'
--   ORDER BY policyname;
--   -- Expected: "profiles: owner select" absent; others present
--
-- C3. Confirm tenant isolation still holds:
--   (run as a non-owner authenticated user)
--   SELECT * FROM public.organizations;   -- should only return own org rows
--   SELECT * FROM public.plans;           -- should return 0 rows (non-owner)
--   SELECT public.is_owner();             -- should return false
--
-- C4. Confirm owner access still holds:
--   (run as owner email user)
--   SELECT * FROM public.organizations;   -- should return all org rows
--   SELECT * FROM public.plans;           -- should return all plans
--   SELECT public.is_owner();             -- should return true
--
-- ── D. Remaining security gaps (not addressable via SQL migration) ────────────
--
-- D1. Leaked Password Protection
--     Location: Supabase Dashboard → Authentication → Security
--     Action:   Toggle "Leaked Password Protection" ON
--     Risk:     Without this, users can set passwords that appear in known
--               breach databases (Have I Been Pwned). Medium risk for B2B SaaS.
--     Cannot be configured via SQL — requires manual dashboard action.
--
-- D2. Email OTP expiry / session length
--     Review session token lifetime in Dashboard → Authentication → Sessions.
--     Recommended: max 1 hour for owner sessions.
--
-- ── End of C1 migration ───────────────────────────────────────────────────────
