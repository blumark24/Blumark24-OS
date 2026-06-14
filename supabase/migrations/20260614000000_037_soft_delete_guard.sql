-- Migration 037: Soft-delete guard helpers
-- DO NOT APPLY without reviewing with the team.
-- Created by P0 Security Stabilization — 2026-06-14.
--
-- Purpose: Ensure the delete-user API route can reliably perform soft
-- deactivation and check for open tasks before any hard delete.
--
-- This migration is SAFE to apply (adds index + view only — no schema changes).

-- Index to speed up "does this user have open tasks?" check in the API.
create index if not exists idx_tasks_assignee_status
  on public.tasks (assignee_id, status)
  where status <> 'مكتملة';

-- Convenience view for finding active (non-deactivated) users.
-- Used for soft-delete verification in admin tooling.
create or replace view public.active_profiles as
  select id, email, name, role, organization_id, department
  from public.profiles
  where is_active = true;

comment on view public.active_profiles is
  'Active (non-deactivated) user profiles. Soft-deleted users have is_active=false and do not appear here.';
