-- ============================================================
-- C2 — AUDIT PERFORMANCE INDEXES
-- Adds database indexes to support server-side filtering and
-- pagination on owner_audit_logs at 10,000+ row scale.
--
-- SAFETY RULES (all applied):
--   • CREATE INDEX IF NOT EXISTS — idempotent, no drops
--   • No table drops, no data deletes, no schema changes
--   • No RLS changes, no policy weakening
--   • No broad PUBLIC access introduced
--   • CONCURRENTLY not used (not supported inside transaction blocks
--     and not needed for index creation on empty/small tables at
--     migration time — add CONCURRENTLY manually for live large tables)
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.owner_audit_logs') IS NULL THEN
    RAISE NOTICE 'C2: owner_audit_logs does not exist — skipping indexes';
    RETURN;
  END IF;
END $$;

-- ── Single-column indexes ─────────────────────────────────────────────────────

-- Primary sort key for all audit log fetches (ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_owner_audit_logs_created_at
  ON public.owner_audit_logs (created_at DESC);

-- Equality filter: target_type (subscription / organization / plan / user / system)
CREATE INDEX IF NOT EXISTS idx_owner_audit_logs_target_type
  ON public.owner_audit_logs (target_type);

-- Equality / IN filter: action (used for severity-tier server-side filtering)
CREATE INDEX IF NOT EXISTS idx_owner_audit_logs_action
  ON public.owner_audit_logs (action);

-- ── Composite indexes for combined filter + sort ──────────────────────────────

-- target_type equality + created_at sort (most common combined filter)
CREATE INDEX IF NOT EXISTS idx_owner_audit_logs_target_type_created_at
  ON public.owner_audit_logs (target_type, created_at DESC);

-- action equality/IN + created_at sort (severity-tier filter + sort)
CREATE INDEX IF NOT EXISTS idx_owner_audit_logs_action_created_at
  ON public.owner_audit_logs (action, created_at DESC);

-- ── Verification query (run read-only after applying) ─────────────────────────
--
--   SELECT indexname, indexdef
--   FROM pg_indexes
--   WHERE tablename = 'owner_audit_logs'
--   ORDER BY indexname;
--
--   Expected: 5 new idx_owner_audit_logs_* entries (plus any pre-existing PK/unique).
--
-- ── End of C2 migration ───────────────────────────────────────────────────────
