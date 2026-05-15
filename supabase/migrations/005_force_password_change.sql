-- Migration 005: force_password_change flag on profiles
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to run multiple times (IF NOT EXISTS / idempotent).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS force_password_change boolean NOT NULL DEFAULT false;

-- Allow authenticated users to update this column on their own row.
-- The existing "profiles: update" policy (USING auth.uid() = id) already covers this.
-- No additional policy needed.
