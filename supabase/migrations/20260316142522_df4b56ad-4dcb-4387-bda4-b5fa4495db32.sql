
-- Programs table (courses, webinars, seminars)
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  program_type text NOT NULL DEFAULT 'course',
  cover_image_url text,
  certificate_type text NOT NULL DEFAULT 'completion',
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  duration_hours integer DEFAULT 0,
  completion_threshold integer NOT NULL DEFAULT 80,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Program modules (YouTube videos)
CREATE TABLE public.program_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  video_url text NOT NULL,
  duration_minutes integer DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enrollments
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'enrolled',
  progress_percent integer NOT NULL DEFAULT 0,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, program_id)
);

-- Module progress tracking
CREATE TABLE public.module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.program_modules(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  watch_percent integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  last_watched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Certificates
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  certificate_type text NOT NULL DEFAULT 'completion',
  certificate_number text NOT NULL UNIQUE,
  holder_name text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id, certificate_type)
);

-- Certificate number generator
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM now())::TEXT;
  SELECT LPAD((COUNT(*) + 1)::TEXT, 6, '0') INTO seq_part FROM public.certificates;
  RETURN 'ACAD-CERT-' || year_part || '-' || seq_part;
END;
$$;

-- Updated_at trigger
CREATE TRIGGER set_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Programs: public read published, admin manage
CREATE POLICY "Public can read published programs" ON public.programs FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins can read all programs" ON public.programs FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert programs" ON public.programs FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update programs" ON public.programs FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can delete programs" ON public.programs FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Modules: public read via published programs, admin manage
CREATE POLICY "Public can read modules" ON public.program_modules FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.programs WHERE id = program_id AND is_published = true));
CREATE POLICY "Admins can read all modules" ON public.program_modules FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert modules" ON public.program_modules FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update modules" ON public.program_modules FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can delete modules" ON public.program_modules FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Enrollments: users own, admin read all
CREATE POLICY "Users can read own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can enroll themselves" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own enrollment" ON public.enrollments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can read all enrollments" ON public.enrollments FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Module progress: users own
CREATE POLICY "Users can read own progress" ON public.module_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own progress" ON public.module_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own progress" ON public.module_progress FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Certificates: users own read, admin read all, users insert own
CREATE POLICY "Users can read own certificates" ON public.certificates FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can read all certificates" ON public.certificates FOR SELECT TO authenticated USING (is_admin(auth.uid()));
