-- ============================================================
-- 034 — ORGANIZATION LOGOS STORAGE (bucket + tenant-scoped RLS)
-- Additive only. No existing tables, columns, data, or app RLS touched.
-- Safe to run on a live database (idempotent).
-- ------------------------------------------------------------
-- Why this migration exists:
--   TENANT-LOGO-UPLOAD-1 lets an organization_manager upload a company logo.
--   Files live in Supabase Storage at:  organization-logos/{organization_id}/logo.{ext}
--   The public URL is saved into tenant_workspace_settings.company_info.logo_url
--   (a JSONB key — no schema/column migration needed).
--
-- Isolation guarantee:
--   The first path segment MUST equal the caller's own organization_id, so
--   Organization A can never write/overwrite Organization B's logo. Only
--   owner / super_admin / organization_manager may write. Read is public
--   (logos are non-sensitive brand assets); each tenant only ever *renders*
--   its own logo_url, which is read from its own tenant_workspace_settings row.
--
-- Requires: public.current_org_id() (011), public.is_owner() (009),
--           public.get_my_role() (002/004).
-- ============================================================

-- 1. Bucket — public read, writes gated by the policies below.
insert into storage.buckets (id, name, public)
values ('organization-logos', 'organization-logos', true)
on conflict (id) do nothing;

-- 2. Object-level policies (storage.objects already has RLS enabled by Supabase).
--    (storage.foldername(name))[1] = '{organization_id}'  (first path segment)
drop policy if exists "org logos: public read"   on storage.objects;
drop policy if exists "org logos: insert own org" on storage.objects;
drop policy if exists "org logos: update own org" on storage.objects;
drop policy if exists "org logos: delete own org" on storage.objects;

create policy "org logos: public read"
  on storage.objects for select
  using ( bucket_id = 'organization-logos' );

create policy "org logos: insert own org"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'organization-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and (
      public.is_owner()
      or public.get_my_role() in ('super_admin', 'organization_manager')
    )
  );

create policy "org logos: update own org"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'organization-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and (
      public.is_owner()
      or public.get_my_role() in ('super_admin', 'organization_manager')
    )
  )
  with check (
    bucket_id = 'organization-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and (
      public.is_owner()
      or public.get_my_role() in ('super_admin', 'organization_manager')
    )
  );

create policy "org logos: delete own org"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'organization-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and (
      public.is_owner()
      or public.get_my_role() in ('super_admin', 'organization_manager')
    )
  );
