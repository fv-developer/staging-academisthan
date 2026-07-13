
-- Add teacher_type to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teacher_type text DEFAULT NULL;

-- Create institutions table with full showcase fields
CREATE TABLE public.institutions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Representative details
  representative_name text NOT NULL,
  representative_email text NOT NULL,
  representative_phone text,
  representative_designation text,
  representative_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Institution basics
  institution_name text NOT NULL,
  institution_type text NOT NULL DEFAULT 'college', -- college, university, private_institution, k12_school, deemed_university, autonomous_college
  affiliated_university text,
  -- Location
  city text,
  state text,
  address text,
  pincode text,
  website text,
  -- Accreditation & Rankings
  naac_grade text,
  nirf_rank integer,
  established_year integer,
  -- Stats
  student_count integer,
  faculty_count integer,
  -- Showcase
  logo_url text,
  description text,
  achievements text,
  programs_offered text[] DEFAULT '{}',
  notable_alumni text,
  -- Membership
  membership_id text UNIQUE,
  membership_status text NOT NULL DEFAULT 'active',
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- Public can read active institutions
CREATE POLICY "Public can read active institutions"
ON public.institutions FOR SELECT
TO anon, authenticated
USING (membership_status = 'active');

-- Representatives can update their own institution
CREATE POLICY "Representatives can update own institution"
ON public.institutions FOR UPDATE
TO authenticated
USING (representative_user_id = auth.uid())
WITH CHECK (representative_user_id = auth.uid());

-- Anyone authenticated can register an institution
CREATE POLICY "Authenticated can register institution"
ON public.institutions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admins can manage all institutions
CREATE POLICY "Admins can read all institutions"
ON public.institutions FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update institutions"
ON public.institutions FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete institutions"
ON public.institutions FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Generate institution membership ID
CREATE OR REPLACE FUNCTION public.generate_institution_membership_id()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM now())::TEXT;
  SELECT LPAD((COUNT(*) + 1)::TEXT, 4, '0') INTO seq_part FROM public.institutions;
  RETURN 'INST-' || year_part || '-' || seq_part;
END;
$$;

-- Auto-set membership_id on insert
CREATE OR REPLACE FUNCTION public.set_institution_membership_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.membership_id IS NULL THEN
    NEW.membership_id := generate_institution_membership_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_institution_membership_id_trigger
BEFORE INSERT ON public.institutions
FOR EACH ROW EXECUTE FUNCTION public.set_institution_membership_id();

-- Updated_at trigger
CREATE TRIGGER update_institutions_updated_at
BEFORE UPDATE ON public.institutions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Storage bucket for institution logos
INSERT INTO storage.buckets (id, name, public) VALUES ('institution-logos', 'institution-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read institution logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'institution-logos');

CREATE POLICY "Authenticated can upload institution logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'institution-logos');

CREATE POLICY "Users can update own institution logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'institution-logos');
