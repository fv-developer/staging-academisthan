
-- Switch views back to security_invoker = true (recommended by linter)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id, full_name, designation, department, institution,
  city, state, specialization, experience_years, avatar_url,
  membership_id, bio, teacher_type, created_at
FROM public.profiles
WHERE membership_status = 'active';

GRANT SELECT ON public.public_profiles TO anon, authenticated;

DROP VIEW IF EXISTS public.public_institutions;
CREATE VIEW public.public_institutions
WITH (security_invoker = true) AS
SELECT
  id, institution_name, institution_type, affiliated_university,
  city, state, pincode, website, naac_grade, nirf_rank,
  established_year, student_count, faculty_count, logo_url,
  description, achievements, programs_offered, notable_alumni,
  membership_id, created_at
FROM public.institutions
WHERE membership_status = 'active';

GRANT SELECT ON public.public_institutions TO anon, authenticated;

-- Re-add anon SELECT policy on base tables — column-level REVOKE is what protects PII
CREATE POLICY "Anon can read non-sensitive profile fields"
ON public.profiles
FOR SELECT
TO anon
USING (membership_status = 'active');

CREATE POLICY "Anon can read non-sensitive institution fields"
ON public.institutions
FOR SELECT
TO anon
USING (membership_status = 'active');

-- Re-assert column-level revokes (PII stays hidden from anon at the DB layer)
REVOKE SELECT (email, phone, linkedin_url, google_scholar_url) ON public.profiles FROM anon;
REVOKE SELECT (representative_email, representative_phone, representative_name, representative_designation, representative_user_id) ON public.institutions FROM anon;
