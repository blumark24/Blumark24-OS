-- Add avatar_url to profiles as a nullable column.
-- This column is referenced in AuthContext buildUser() but was absent
-- from previous migrations. IF NOT EXISTS makes this idempotent.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
