-- 036 — Add job_title to employees
-- Additive only. Existing rows remain NULL (no backfill required).
-- job_title stores the organizational display tier for a hire (e.g. 'مدير إدارة').
-- Written exclusively by the create-user / update-user admin API routes.
-- Must NOT be confused with employees.role (auth role, constrained to fixed values).
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS job_title text;
