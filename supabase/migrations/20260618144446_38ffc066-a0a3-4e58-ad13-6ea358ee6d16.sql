
-- 1. Restrict sensitive columns on profiles from anon
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, full_name, designation, department, institution, city, state, specialization, experience_years, avatar_url, membership_id, membership_status, bio, linkedin_url, google_scholar_url, teacher_type, created_at, updated_at)
  ON public.profiles TO anon;

-- 2. Restrict sensitive columns on institutions from anon
REVOKE SELECT ON public.institutions FROM anon;
GRANT SELECT (id, institution_name, institution_type, affiliated_university, city, state, address, pincode, website, logo_url, membership_id, membership_status, created_at, updated_at)
  ON public.institutions TO anon;

-- 3. Storage: tighten institution-logos policies (path must start with auth.uid())
DROP POLICY IF EXISTS "Authenticated can upload institution logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own institution logos" ON storage.objects;

CREATE POLICY "Users can upload own institution logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'institution-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own institution logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'institution-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'institution-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own institution logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'institution-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Stop public listing of files. Public buckets still serve files via direct URL.
DROP POLICY IF EXISTS "Anyone can read institution logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read admin uploads" ON storage.objects;

-- 5. Revoke EXECUTE on internal SECURITY DEFINER helpers from public/anon/authenticated.
-- Keep has_role/is_admin executable for RLS; trigger functions don't need direct EXECUTE.
REVOKE EXECUTE ON FUNCTION public.generate_certificate_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_membership_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_institution_membership_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_institution_membership_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_assign_super_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
