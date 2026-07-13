
-- Recreate views with SECURITY DEFINER semantics (default: security_invoker = false)
-- so anon can read them WITHOUT needing direct RLS access on the underlying tables.
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT
  id, full_name, designation, department, institution,
  city, state, specialization, experience_years, avatar_url,
  membership_id, bio, teacher_type, created_at
FROM public.profiles
WHERE membership_status = 'active';

GRANT SELECT ON public.public_profiles TO anon, authenticated;

DROP VIEW IF EXISTS public.public_institutions;
CREATE VIEW public.public_institutions AS
SELECT
  id, institution_name, institution_type, affiliated_university,
  city, state, pincode, website, naac_grade, nirf_rank,
  established_year, student_count, faculty_count, logo_url,
  description, achievements, programs_offered, notable_alumni,
  membership_id, created_at
FROM public.institutions
WHERE membership_status = 'active';

GRANT SELECT ON public.public_institutions TO anon, authenticated;

-- Drop the loophole policies that let anon read the base tables
DROP POLICY IF EXISTS "Anyone can read active profiles via view" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read active institutions via view" ON public.institutions;

-- Authenticated users (signed-in members) can still browse the full directory on the base table
CREATE POLICY "Authenticated can read active profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (membership_status = 'active');

CREATE POLICY "Authenticated can read active institutions"
ON public.institutions
FOR SELECT
TO authenticated
USING (membership_status = 'active');
