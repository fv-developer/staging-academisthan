
-- 1. profiles
DROP POLICY IF EXISTS "Public can read basic profile info" ON public.profiles;

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT id, full_name, designation, department, institution, city, state,
       specialization, experience_years, membership_id, membership_status,
       linkedin_url, google_scholar_url, avatar_url, bio
FROM public.profiles
WHERE membership_status = 'active';

GRANT SELECT ON public.profiles_public TO anon, authenticated;

CREATE POLICY "Public can read active profiles (safe cols via view)"
ON public.profiles
FOR SELECT
TO anon
USING (membership_status = 'active');

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, full_name, designation, department, institution, city, state,
              specialization, experience_years, membership_id, membership_status,
              linkedin_url, google_scholar_url, avatar_url, bio) ON public.profiles TO anon;

-- 2. institutions
DROP POLICY IF EXISTS "Public can read active institutions" ON public.institutions;

CREATE OR REPLACE VIEW public.institutions_public
WITH (security_invoker = on) AS
SELECT id, institution_name, institution_type, affiliated_university, city, state,
       address, pincode, website, naac_grade, nirf_rank, established_year,
       student_count, faculty_count, logo_url, description, achievements,
       programs_offered, notable_alumni, membership_id, membership_status, created_at
FROM public.institutions
WHERE membership_status = 'active';

GRANT SELECT ON public.institutions_public TO anon, authenticated;

CREATE POLICY "Public can read active institutions (safe cols via view)"
ON public.institutions
FOR SELECT
TO anon, authenticated
USING (membership_status = 'active');

REVOKE SELECT ON public.institutions FROM anon;
GRANT SELECT (id, institution_name, institution_type, affiliated_university, city, state,
              address, pincode, website, naac_grade, nirf_rank, established_year,
              student_count, faculty_count, logo_url, description, achievements,
              programs_offered, notable_alumni, membership_id, membership_status, created_at)
ON public.institutions TO anon;

-- 3. contact_submissions
CREATE POLICY "Admins can read all contact submissions"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
