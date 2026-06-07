-- ============================================================
-- TENANT-LOGO-UPLOAD-1 — organization logo storage bucket
-- Customer workspace tenant logos are stored under:
--   organization-logos/<organization_id>/logo-<timestamp>.<ext>
-- ============================================================

DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION 'organization logo storage requires public.current_org_id()';
  END IF;
  IF to_regprocedure('public.get_my_role()') IS NULL THEN
    RAISE EXCEPTION 'organization logo storage requires public.get_my_role()';
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-logos',
  'organization-logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "organization_logos_select_own_org" ON storage.objects;
CREATE POLICY "organization_logos_select_own_org"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'organization-logos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
  );

DROP POLICY IF EXISTS "organization_logos_insert_own_org_manager" ON storage.objects;
CREATE POLICY "organization_logos_insert_own_org_manager"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'organization-logos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
    AND public.get_my_role() = 'organization_manager'
  );
DROP POLICY IF EXISTS "organization_logos_update_own_org_manager" ON storage.objects;
CREATE POLICY "organization_logos_update_own_org_manager"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'organization-logos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
    AND public.get_my_role() = 'organization_manager'
  )
  WITH CHECK (
    bucket_id = 'organization-logos'
    AND (storage.foldername(name))[1] = public.current_org_id()::text
    AND public.get_my_role() = 'organization_manager'
  );
