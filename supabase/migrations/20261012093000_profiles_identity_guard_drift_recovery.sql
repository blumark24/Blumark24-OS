-- Blumark24 OS tenant isolation drift recovery
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'profiles table is required';
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: update" ON public.profiles;
CREATE POLICY "profiles: update"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id OR public.get_my_role() = 'super_admin' OR public.is_owner())
  WITH CHECK ((select auth.uid()) = id OR public.get_my_role() = 'super_admin' OR public.is_owner());

CREATE OR REPLACE FUNCTION public.profiles_enforce_identity_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
DECLARE
  v_is_privileged boolean :=
    COALESCE((select auth.role()) = 'service_role', false)
    OR COALESCE(public.is_owner(), false)
    OR COALESCE(public.get_my_role() = 'super_admin', false);
  v_old jsonb;
  v_new jsonb := to_jsonb(NEW);
  v_col text;
BEGIN
  IF v_is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.id IS DISTINCT FROM (select auth.uid()) THEN
      RAISE EXCEPTION 'profile identity assignment denied' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF (v_new ? 'role') AND COALESCE(v_new ->> 'role', 'employee') <> 'employee' THEN
      RAISE EXCEPTION 'profile role assignment denied' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF (v_new ? 'organization_id') AND (v_new ->> 'organization_id') IS NOT NULL THEN
      RAISE EXCEPTION 'profile organization assignment denied' USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
  END IF;

  v_old := to_jsonb(OLD);
  FOREACH v_col IN ARRAY ARRAY['role','organization_id','is_active','force_password_change'] LOOP
    IF (v_old ? v_col) AND (v_new ? v_col)
       AND (v_old -> v_col) IS DISTINCT FROM (v_new -> v_col) THEN
      RAISE EXCEPTION 'protected profile field update denied' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_block_protected_updates ON public.profiles;
DROP TRIGGER IF EXISTS profiles_enforce_identity_guard ON public.profiles;
CREATE TRIGGER profiles_enforce_identity_guard
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_enforce_identity_guard();

REVOKE ALL ON FUNCTION public.profiles_enforce_identity_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.profiles_enforce_identity_guard() FROM anon;
REVOKE ALL ON FUNCTION public.profiles_enforce_identity_guard() FROM authenticated;
