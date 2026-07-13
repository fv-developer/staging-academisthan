
-- Create storage bucket for admin uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('admin-uploads', 'admin-uploads', true);

-- Storage RLS: admins can upload
CREATE POLICY "Admins can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'admin-uploads' AND public.is_admin(auth.uid()));

-- Admins can update their uploads
CREATE POLICY "Admins can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'admin-uploads' AND public.is_admin(auth.uid()));

-- Admins can delete files
CREATE POLICY "Admins can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'admin-uploads' AND public.is_admin(auth.uid()));

-- Public can read uploaded files
CREATE POLICY "Public can read admin uploads"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'admin-uploads');

-- Create events table for admin-managed events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  content text DEFAULT '',
  event_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  location text DEFAULT '',
  venue text DEFAULT '',
  event_type text NOT NULL DEFAULT 'conference',
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  registration_url text,
  speakers jsonb DEFAULT '[]'::jsonb,
  highlights jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  max_attendees integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public read published events
CREATE POLICY "Public can read published events"
ON public.events FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- Admins can read all events
CREATE POLICY "Admins can read all events"
ON public.events FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can insert events
CREATE POLICY "Admins can insert events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Admins can update events
CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Admins can delete events
CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create analytics_events table for page views / actions tracking
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'page_view',
  page_path text,
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics (anonymous tracking)
CREATE POLICY "Anyone can insert analytics"
ON public.analytics_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can read analytics"
ON public.analytics_events FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
