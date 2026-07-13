
-- Profiles table with Academisthan Fellow membership
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  designation TEXT,
  department TEXT,
  institution TEXT,
  city TEXT,
  state TEXT,
  specialization TEXT,
  experience_years INTEGER DEFAULT 0,
  avatar_url TEXT,
  membership_id TEXT UNIQUE,
  membership_status TEXT DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'suspended')),
  bio TEXT,
  linkedin_url TEXT,
  google_scholar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Public profiles (for community page later)
CREATE POLICY "Public can read basic profile info"
  ON public.profiles FOR SELECT
  TO anon
  USING (membership_status = 'active');

-- Function to generate membership ID: ACAD-YYYY-XXXXX
CREATE OR REPLACE FUNCTION public.generate_membership_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
  new_id TEXT;
  count_existing INTEGER;
BEGIN
  year_part := EXTRACT(YEAR FROM now())::TEXT;
  SELECT COUNT(*) INTO count_existing FROM public.profiles WHERE membership_id IS NOT NULL;
  seq_part := LPAD((count_existing + 1)::TEXT, 5, '0');
  new_id := 'ACAD-' || year_part || '-' || seq_part;
  RETURN new_id;
END;
$$;

-- Trigger function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, membership_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    public.generate_membership_id()
  );
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
