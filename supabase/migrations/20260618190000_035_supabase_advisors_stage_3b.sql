-- ============================================================
-- SUPABASE ADVISORS — Stage 3B
-- Date: 2026-06-18
--
-- Scope: low-risk performance advisor cleanup only.
-- Idempotent. No data deletion. No RLS disabled. No UI/API changes.
-- DO NOT APPLY directly without manual review / DBA approval.
-- ============================================================
-- ADDRESSED
--   P1. unindexed_foreign_keys:
--       executive_office_room_mappings.created_by
--       executive_office_room_mappings.updated_by
--   P2. duplicate_index:
--       departments duplicate structure_level index pair
--
-- INTENTIONALLY NOT CHANGED IN THIS STAGE
--   - unused_index: left intact until production traffic matures.
--   - auth_rls_initplan: deferred to Stage 3C because policy rewrites need
--     a larger RLS regression pass.
--   - multiple_permissive_policies: deferred to Stage 3C because policy
--     consolidation can change authorization behavior if rushed.
-- ============================================================

-- ── 1. Cover FK: executive_office_room_mappings.created_by ───────────────────
-- Supabase Advisor flags the FK to public.profiles(id) when no covering index
-- exists on the referencing column. This improves UPDATE/DELETE planning on
-- profiles and joins/filters by creator.
CREATE INDEX IF NOT EXISTS executive_office_room_mappings_created_by_idx
  ON public.executive_office_room_mappings (created_by);

-- ── 2. Cover FK: executive_office_room_mappings.updated_by ───────────────────
-- Same rationale as created_by. Kept as a separate single-column index because
-- the FK is single-column and Supabase Advisor expects a covering index.
CREATE INDEX IF NOT EXISTS executive_office_room_mappings_updated_by_idx
  ON public.executive_office_room_mappings (updated_by);

-- ── 3. Remove one duplicate departments index ────────────────────────────────
-- Advisor reported identical indexes:
--   - idx_departments_org_structure_level
--   - idx_departments_structure_level
-- Keep the org-scoped name because tenant queries are organization-oriented;
-- drop the older/generic duplicate only if it exists.
DO $$
BEGIN
  IF to_regclass('public.idx_departments_structure_level') IS NOT NULL THEN
    DROP INDEX public.idx_departments_structure_level;
  END IF;
END $$;
