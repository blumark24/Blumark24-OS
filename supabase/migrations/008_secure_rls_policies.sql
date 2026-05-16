-- ============================================================
-- 008 — SECURE RLS POLICIES
-- Safe to re-run (DROP IF EXISTS before every CREATE).
-- Ensures correct row-level security on profiles and employees
-- regardless of which earlier migrations have been applied.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- get_my_role() — SECURITY DEFINER so it bypasses RLS when
-- called inside other RLS policies (prevents infinite recursion
-- and allows the function to read profiles unconditionally).
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(role, 'employee')
  FROM public.profiles
  WHERE id = auth.uid();
$$;

-- ─────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all known variants so we start from a clean slate
DROP POLICY IF EXISTS "profiles: select"              ON public.profiles;
DROP POLICY IF EXISTS "profiles: read"                ON public.profiles;
DROP POLICY IF EXISTS "profiles: read own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles: read own or admin"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: insert own"          ON public.profiles;
DROP POLICY IF EXISTS "profiles: update"              ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own"          ON public.profiles;
DROP POLICY IF EXISTS "profiles: delete"              ON public.profiles;
DROP POLICY IF EXISTS "profiles: super_admin all"     ON public.profiles;
DROP POLICY IF EXISTS "profiles: super_admin read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: super_admin write"   ON public.profiles;
DROP POLICY IF EXISTS profiles_select                 ON public.profiles;
DROP POLICY IF EXISTS profiles_update                 ON public.profiles;
DROP POLICY IF EXISTS profiles_insert                 ON public.profiles;
DROP POLICY IF EXISTS profiles_delete                 ON public.profiles;

-- SELECT: own row or super_admin
CREATE POLICY "profiles: select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.get_my_role() = 'super_admin');

-- INSERT: own row only (service-role bypasses RLS entirely)
CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: own row or super_admin (prevents self-escalation — role
-- changes must go through the /api/admin/update-user server route
-- which uses service_role and validates the caller's identity)
CREATE POLICY "profiles: update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.get_my_role() = 'super_admin');

-- DELETE: super_admin only
CREATE POLICY "profiles: delete"
  ON public.profiles FOR DELETE
  USING (public.get_my_role() = 'super_admin');

-- ─────────────────────────────────────────────────────────────
-- EMPLOYEES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employees: read"               ON public.employees;
DROP POLICY IF EXISTS "employees: write"              ON public.employees;
DROP POLICY IF EXISTS "employees: authenticated read" ON public.employees;
DROP POLICY IF EXISTS "employees: super_admin write"  ON public.employees;
DROP POLICY IF EXISTS employees_select_policy         ON public.employees;
DROP POLICY IF EXISTS employees_insert_policy         ON public.employees;
DROP POLICY IF EXISTS employees_update_policy         ON public.employees;
DROP POLICY IF EXISTS employees_delete_policy         ON public.employees;

-- SELECT: any authenticated session (dashboard needs to list all employees)
CREATE POLICY "employees: read"
  ON public.employees FOR SELECT
  USING (auth.role() = 'authenticated');

-- ALL write operations (INSERT / UPDATE / DELETE): super_admin only.
-- The /api/admin/create-user route uses service_role which bypasses RLS,
-- so this policy is the safety net for direct client writes.
CREATE POLICY "employees: write"
  ON public.employees FOR ALL
  USING (public.get_my_role() = 'super_admin');
