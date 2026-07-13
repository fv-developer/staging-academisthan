
-- 1. Replace overly-broad public SELECT on profiles with a column-safe view
DROP POLICY IF EXISTS "Public can read active profiles (safe cols via view)" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id, full_name, designation, department, institution,
  city, state, specialization, experience_years, avatar_url,
  membership_id, bio, teacher_type, created_at
FROM public.profiles
WHERE membership_status = 'active';

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Allow the view itself to read the underlying table by granting a narrow SELECT
-- (RLS still applies; we add a policy below that permits reading non-sensitive rows)
CREATE POLICY "Anyone can read active profiles via view"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (membership_status = 'active');

-- Tighten: drop the broad policy for direct table access by anon — they should use the view
-- (We keep the new policy but additionally REVOKE column-level for sensitive fields from anon)
REVOKE SELECT (email, phone, linkedin_url, google_scholar_url) ON public.profiles FROM anon;

-- 2. Same for institutions
DROP POLICY IF EXISTS "Public can read active institutions (safe cols via view)" ON public.institutions;

CREATE OR REPLACE VIEW public.public_institutions
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

CREATE POLICY "Anyone can read active institutions via view"
ON public.institutions
FOR SELECT
TO anon, authenticated
USING (membership_status = 'active');

REVOKE SELECT (representative_email, representative_phone) ON public.institutions FROM anon;

-- 3. Lock down SECURITY DEFINER helpers that should never be called via the API
REVOKE EXECUTE ON FUNCTION public.generate_institution_membership_id() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_institution_membership_id() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_certificate_number() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_membership_id() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_assign_super_admin() FROM anon, authenticated, PUBLIC;

-- has_role and is_admin remain callable (RLS policies depend on them)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated;

-- 4. Add helpful indexes for hot paths
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_news_updates_published_at ON public.news_updates(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_updates_category ON public.news_updates(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_status ON public.blog_posts(review_status) WHERE review_status = 'published';
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_automation_runs_function_status ON public.automation_runs(function_name, status, started_at DESC);
