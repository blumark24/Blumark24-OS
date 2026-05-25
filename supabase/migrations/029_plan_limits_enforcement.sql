-- ============================================================
-- 029 — PLAN LIMITS ENFORCEMENT (server-side)
-- Blocks inserts that exceed subscription plan caps.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_plan_limit_departments()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_org UUID;
  v_plan UUID;
  v_max INTEGER;
  v_count INTEGER;
BEGIN
  v_org := COALESCE(NEW.organization_id, public.current_org_id());
  IF v_org IS NULL THEN RETURN NEW; END IF;

  IF public.is_owner() OR public.get_my_role() = 'super_admin' THEN RETURN NEW; END IF;

  SELECT plan_id INTO v_plan FROM public.organizations WHERE id = v_org;
  IF v_plan IS NULL THEN RETURN NEW; END IF;

  SELECT limit_value INTO v_max
  FROM public.plan_limits
  WHERE plan_id = v_plan AND limit_key = 'max_departments'
  LIMIT 1;

  IF v_max IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.departments
  WHERE organization_id = v_org;

  IF v_count >= v_max THEN
    RAISE EXCEPTION 'plan_limit_exceeded: max_departments (%)', v_max
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_plan_limit_departments ON public.departments;
CREATE TRIGGER trg_enforce_plan_limit_departments
  BEFORE INSERT ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit_departments();

CREATE OR REPLACE FUNCTION public.enforce_plan_limit_employees()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_org UUID;
  v_plan UUID;
  v_max INTEGER;
  v_count INTEGER;
BEGIN
  v_org := COALESCE(NEW.organization_id, public.current_org_id());
  IF v_org IS NULL THEN RETURN NEW; END IF;

  IF public.is_owner() OR public.get_my_role() = 'super_admin' THEN RETURN NEW; END IF;

  SELECT plan_id INTO v_plan FROM public.organizations WHERE id = v_org;
  IF v_plan IS NULL THEN RETURN NEW; END IF;

  SELECT limit_value INTO v_max
  FROM public.plan_limits
  WHERE plan_id = v_plan AND limit_key = 'max_employees'
  LIMIT 1;

  IF v_max IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.employees
  WHERE organization_id = v_org;

  IF v_count >= v_max THEN
    RAISE EXCEPTION 'plan_limit_exceeded: max_employees (%)', v_max
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_plan_limit_employees ON public.employees;
CREATE TRIGGER trg_enforce_plan_limit_employees
  BEFORE INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit_employees();
