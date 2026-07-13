
-- Tighten contact_submissions INSERT policy: require valid email format and non-empty fields
DROP POLICY "Anyone can submit contact form" ON public.contact_submissions;

CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(name) > 0 AND length(name) <= 100
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(message) > 0 AND length(message) <= 2000
);
