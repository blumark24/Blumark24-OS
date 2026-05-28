-- ============================================================
-- 033 — PUBLIC CODES (DB-FOUNDATION-5)
-- Automatic, stable, human-readable codes for tenants and key records.
--
-- Scope: schema + trigger code generation only.
-- No row deletion, no row movement, no RLS/Auth/UI changes.
-- UUID primary keys remain the source of truth; public codes are for display,
-- support, reporting, and future AI assistant references.
-- ============================================================

-- ── 1. Code generation helpers ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.b24_next_global_code(
  p_table regclass,
  p_code_col text,
  p_prefix text,
  p_digits int DEFAULT 6
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next int;
  v_pattern text := '^' || p_prefix || '-([0-9]+)$';
  v_match text := '^' || p_prefix || '-[0-9]+$';
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('b24_public_code:' || p_table::text || ':' || p_code_col));

  EXECUTE format(
    'SELECT COALESCE(MAX(substring(%I from %L)::int), 0) + 1 FROM %s WHERE %I ~ %L',
    p_code_col,
    v_pattern,
    p_table,
    p_code_col,
    v_match
  ) INTO v_next;

  RETURN p_prefix || '-' || lpad(v_next::text, p_digits, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.b24_next_tenant_code(
  p_table regclass,
  p_organization_id uuid,
  p_code_col text,
  p_prefix text,
  p_digits int DEFAULT 4
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next int;
  v_pattern text := '^' || p_prefix || '-([0-9]+)$';
  v_match text := '^' || p_prefix || '-[0-9]+$';
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('b24_public_code:' || p_table::text || ':' || p_code_col || ':' || COALESCE(p_organization_id::text, 'no-org')));

  EXECUTE format(
    'SELECT COALESCE(MAX(substring(%I from %L)::int), 0) + 1 FROM %s WHERE organization_id IS NOT DISTINCT FROM $1 AND %I ~ %L',
    p_code_col,
    v_pattern,
    p_table,
    p_code_col,
    v_match
  ) USING p_organization_id INTO v_next;

  RETURN p_prefix || '-' || lpad(v_next::text, p_digits, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.b24_backfill_global_codes(
  p_table regclass,
  p_code_col text,
  p_prefix text,
  p_digits int DEFAULT 6
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format(
    'WITH ranked AS (
       SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS seq
       FROM %s
       WHERE %I IS NULL OR btrim(%I) = ''''
     )
     UPDATE %s t
     SET %I = $1 || ''-'' || lpad(r.seq::text, $2, ''0'')
     FROM ranked r
     WHERE t.id = r.id',
    p_table,
    p_code_col,
    p_code_col,
    p_table,
    p_code_col
  ) USING p_prefix, p_digits;
END;
$$;

CREATE OR REPLACE FUNCTION public.b24_backfill_tenant_codes(
  p_table regclass,
  p_code_col text,
  p_prefix text,
  p_digits int DEFAULT 4
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format(
    'WITH ranked AS (
       SELECT id, row_number() OVER (PARTITION BY organization_id ORDER BY created_at NULLS LAST, id) AS seq
       FROM %s
       WHERE %I IS NULL OR btrim(%I) = ''''
     )
     UPDATE %s t
     SET %I = $1 || ''-'' || lpad(r.seq::text, $2, ''0'')
     FROM ranked r
     WHERE t.id = r.id',
    p_table,
    p_code_col,
    p_code_col,
    p_table,
    p_code_col
  ) USING p_prefix, p_digits;
END;
$$;

-- ── 2. Add code columns if tables exist ──────────────────────────────────────
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS organization_code text;

DO $$
BEGIN
  IF to_regclass('public.employees') IS NOT NULL THEN
    ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS employee_code text;
  END IF;

  IF to_regclass('public.clients') IS NOT NULL THEN
    ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_code text;
  END IF;

  IF to_regclass('public.tasks') IS NOT NULL THEN
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_code text;
  END IF;

  IF to_regclass('public.departments') IS NOT NULL THEN
    ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS department_code text;
  END IF;

  IF to_regclass('public.invoices') IS NOT NULL THEN
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_code text;
  END IF;
END;
$$;

-- ── 3. Trigger functions ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.b24_assign_organization_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_code IS NULL OR btrim(NEW.organization_code) = '' THEN
    NEW.organization_code := public.b24_next_global_code('public.organizations'::regclass, 'organization_code', 'ORG', 6);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.b24_assign_employee_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.employee_code IS NULL OR btrim(NEW.employee_code) = '' THEN
    NEW.employee_code := public.b24_next_tenant_code('public.employees'::regclass, NEW.organization_id, 'employee_code', 'EMP', 4);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.b24_assign_client_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.client_code IS NULL OR btrim(NEW.client_code) = '' THEN
    NEW.client_code := public.b24_next_tenant_code('public.clients'::regclass, NEW.organization_id, 'client_code', 'CLI', 4);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.b24_assign_task_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.task_code IS NULL OR btrim(NEW.task_code) = '' THEN
    NEW.task_code := public.b24_next_tenant_code('public.tasks'::regclass, NEW.organization_id, 'task_code', 'TSK', 4);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.b24_assign_department_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.department_code IS NULL OR btrim(NEW.department_code) = '' THEN
    NEW.department_code := public.b24_next_tenant_code('public.departments'::regclass, NEW.organization_id, 'department_code', 'DEP', 4);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.b24_assign_invoice_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_code IS NULL OR btrim(NEW.invoice_code) = '' THEN
    NEW.invoice_code := public.b24_next_tenant_code('public.invoices'::regclass, NEW.organization_id, 'invoice_code', 'INV', 4);
  END IF;
  RETURN NEW;
END;
$$;

-- ── 4. Backfill existing rows safely ─────────────────────────────────────────
SELECT public.b24_backfill_global_codes('public.organizations'::regclass, 'organization_code', 'ORG', 6);

DO $$
BEGIN
  IF to_regclass('public.employees') IS NOT NULL THEN
    PERFORM public.b24_backfill_tenant_codes('public.employees'::regclass, 'employee_code', 'EMP', 4);
  END IF;

  IF to_regclass('public.clients') IS NOT NULL THEN
    PERFORM public.b24_backfill_tenant_codes('public.clients'::regclass, 'client_code', 'CLI', 4);
  END IF;

  IF to_regclass('public.tasks') IS NOT NULL THEN
    PERFORM public.b24_backfill_tenant_codes('public.tasks'::regclass, 'task_code', 'TSK', 4);
  END IF;

  IF to_regclass('public.departments') IS NOT NULL THEN
    PERFORM public.b24_backfill_tenant_codes('public.departments'::regclass, 'department_code', 'DEP', 4);
  END IF;

  IF to_regclass('public.invoices') IS NOT NULL THEN
    PERFORM public.b24_backfill_tenant_codes('public.invoices'::regclass, 'invoice_code', 'INV', 4);
  END IF;
END;
$$;

-- ── 5. Uniqueness constraints / indexes ──────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS organizations_organization_code_unique
ON public.organizations (organization_code)
WHERE organization_code IS NOT NULL;

DO $$
BEGIN
  IF to_regclass('public.employees') IS NOT NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS employees_org_employee_code_unique
    ON public.employees (organization_id, employee_code)
    WHERE employee_code IS NOT NULL;
  END IF;

  IF to_regclass('public.clients') IS NOT NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS clients_org_client_code_unique
    ON public.clients (organization_id, client_code)
    WHERE client_code IS NOT NULL;
  END IF;

  IF to_regclass('public.tasks') IS NOT NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS tasks_org_task_code_unique
    ON public.tasks (organization_id, task_code)
    WHERE task_code IS NOT NULL;
  END IF;

  IF to_regclass('public.departments') IS NOT NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS departments_org_department_code_unique
    ON public.departments (organization_id, department_code)
    WHERE department_code IS NOT NULL;
  END IF;

  IF to_regclass('public.invoices') IS NOT NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS invoices_org_invoice_code_unique
    ON public.invoices (organization_id, invoice_code)
    WHERE invoice_code IS NOT NULL;
  END IF;
END;
$$;

-- ── 6. Triggers for future inserts ───────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_b24_assign_organization_code ON public.organizations;
CREATE TRIGGER trg_b24_assign_organization_code
BEFORE INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.b24_assign_organization_code();

DO $$
BEGIN
  IF to_regclass('public.employees') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_b24_assign_employee_code ON public.employees;
    CREATE TRIGGER trg_b24_assign_employee_code
    BEFORE INSERT ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.b24_assign_employee_code();
  END IF;

  IF to_regclass('public.clients') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_b24_assign_client_code ON public.clients;
    CREATE TRIGGER trg_b24_assign_client_code
    BEFORE INSERT ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.b24_assign_client_code();
  END IF;

  IF to_regclass('public.tasks') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_b24_assign_task_code ON public.tasks;
    CREATE TRIGGER trg_b24_assign_task_code
    BEFORE INSERT ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.b24_assign_task_code();
  END IF;

  IF to_regclass('public.departments') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_b24_assign_department_code ON public.departments;
    CREATE TRIGGER trg_b24_assign_department_code
    BEFORE INSERT ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION public.b24_assign_department_code();
  END IF;

  IF to_regclass('public.invoices') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_b24_assign_invoice_code ON public.invoices;
    CREATE TRIGGER trg_b24_assign_invoice_code
    BEFORE INSERT ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.b24_assign_invoice_code();
  END IF;
END;
$$;

-- ============================================================
-- POST-MIGRATION INSPECTION (read-only)
-- ------------------------------------------------------------
-- SELECT organization_code, name, slug FROM public.organizations ORDER BY organization_code;
-- SELECT employee_code, name, organization_id FROM public.employees ORDER BY organization_id, employee_code;
-- SELECT client_code, name, organization_id FROM public.clients ORDER BY organization_id, client_code;
-- SELECT task_code, title, organization_id FROM public.tasks ORDER BY organization_id, task_code;
-- SELECT department_code, name, organization_id FROM public.departments ORDER BY organization_id, department_code;
-- ============================================================

-- ============================================================
-- ROLLBACK (manual — removes DB-FOUNDATION-5 code system)
-- ------------------------------------------------------------
-- DROP TRIGGER IF EXISTS trg_b24_assign_organization_code ON public.organizations;
-- DROP TRIGGER IF EXISTS trg_b24_assign_employee_code ON public.employees;
-- DROP TRIGGER IF EXISTS trg_b24_assign_client_code ON public.clients;
-- DROP TRIGGER IF EXISTS trg_b24_assign_task_code ON public.tasks;
-- DROP TRIGGER IF EXISTS trg_b24_assign_department_code ON public.departments;
-- DROP TRIGGER IF EXISTS trg_b24_assign_invoice_code ON public.invoices;
-- DROP FUNCTION IF EXISTS public.b24_assign_organization_code();
-- DROP FUNCTION IF EXISTS public.b24_assign_employee_code();
-- DROP FUNCTION IF EXISTS public.b24_assign_client_code();
-- DROP FUNCTION IF EXISTS public.b24_assign_task_code();
-- DROP FUNCTION IF EXISTS public.b24_assign_department_code();
-- DROP FUNCTION IF EXISTS public.b24_assign_invoice_code();
-- DROP FUNCTION IF EXISTS public.b24_backfill_global_codes(regclass, text, text, int);
-- DROP FUNCTION IF EXISTS public.b24_backfill_tenant_codes(regclass, text, text, int);
-- DROP FUNCTION IF EXISTS public.b24_next_global_code(regclass, text, text, int);
-- DROP FUNCTION IF EXISTS public.b24_next_tenant_code(regclass, uuid, text, text, int);
-- DROP INDEX IF EXISTS public.organizations_organization_code_unique;
-- DROP INDEX IF EXISTS public.employees_org_employee_code_unique;
-- DROP INDEX IF EXISTS public.clients_org_client_code_unique;
-- DROP INDEX IF EXISTS public.tasks_org_task_code_unique;
-- DROP INDEX IF EXISTS public.departments_org_department_code_unique;
-- DROP INDEX IF EXISTS public.invoices_org_invoice_code_unique;
-- ALTER TABLE public.organizations DROP COLUMN IF EXISTS organization_code;
-- ALTER TABLE public.employees DROP COLUMN IF EXISTS employee_code;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS client_code;
-- ALTER TABLE public.tasks DROP COLUMN IF EXISTS task_code;
-- ALTER TABLE public.departments DROP COLUMN IF EXISTS department_code;
-- ALTER TABLE public.invoices DROP COLUMN IF EXISTS invoice_code;
-- ============================================================
