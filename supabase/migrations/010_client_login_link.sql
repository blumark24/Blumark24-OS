-- ============================================================
-- 010 — CLIENT LOGIN ↔ ORGANIZATION LINK
-- Additive only. No drops of data, no renames, no breaking changes.
-- Safe to run on a live database (every step is IF NOT EXISTS / idempotent).
-- ============================================================
-- Adds the smallest possible link between a client login (a row in
-- public.profiles, which mirrors auth.users) and the organization it
-- belongs to. This is what "إنشاء حساب دخول" (create client login) sets.
--
-- Tenant safety:
--   • A client account can still only read its OWN profile row (the existing
--     "profiles: select" policy = own row OR super_admin is unchanged), so a
--     client cannot enumerate other organizations' accounts.
--   • The platform owner gets an additive SELECT policy so the Owner Command
--     Center can show which organizations already have a linked login.
--   • All writes to profiles continue to go through the service-role server
--     route (which bypasses RLS); no client-side write policy is added.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Link column: profiles.organization_id → organizations(id)
--    Nullable: existing internal/staff accounts have no organization.
--    ON DELETE SET NULL so removing an organization never deletes a login.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID
  REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id
  ON public.profiles (organization_id);

-- ─────────────────────────────────────────────────────────────
-- 2. Platform-owner read access to profiles
--    Additive permissive policy (OR-ed with the existing
--    "profiles: select"). Lets the owner see link status only;
--    it does NOT grant any client cross-tenant access.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles: owner select" ON public.profiles;

CREATE POLICY "profiles: owner select"
  ON public.profiles FOR SELECT
  USING (public.is_owner());
