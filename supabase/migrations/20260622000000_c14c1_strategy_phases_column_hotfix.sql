-- C14-C1 Hotfix: add start_date / end_date to strategy_phases if missing.
-- The frontend query in useData.ts (STRATEGY_PHASE_COLUMNS) selects these columns,
-- but the live table may have been created before they were included.
-- Using text type (matching 002_missing_tables_and_fixes.sql); frontend casts to string.
ALTER TABLE public.strategy_phases
  ADD COLUMN IF NOT EXISTS start_date text NOT NULL DEFAULT '';
ALTER TABLE public.strategy_phases
  ADD COLUMN IF NOT EXISTS end_date text NOT NULL DEFAULT '';
