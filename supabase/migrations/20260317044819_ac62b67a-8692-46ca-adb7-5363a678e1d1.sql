
-- Directory of autonomous colleges, updated regularly
CREATE TABLE public.autonomous_colleges_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name text NOT NULL,
  state text NOT NULL,
  city text,
  affiliated_university text,
  naac_grade text,
  autonomous_since integer,
  website text,
  institution_type text DEFAULT 'college',
  is_active boolean DEFAULT true,
  source_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(college_name, affiliated_university)
);

ALTER TABLE public.autonomous_colleges_directory ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public can read autonomous colleges"
ON public.autonomous_colleges_directory FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Admin CRUD
CREATE POLICY "Admins can manage autonomous colleges"
ON public.autonomous_colleges_directory FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Auto-update timestamp
CREATE TRIGGER update_autonomous_colleges_updated_at
BEFORE UPDATE ON public.autonomous_colleges_directory
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Index for fast state/university lookups
CREATE INDEX idx_autonomous_colleges_state ON public.autonomous_colleges_directory(state);
CREATE INDEX idx_autonomous_colleges_university ON public.autonomous_colleges_directory(affiliated_university);
