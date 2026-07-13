
-- Create news_updates table
CREATE TABLE public.news_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  content text,
  category text NOT NULL DEFAULT 'announcement',
  source_url text,
  source_name text,
  image_url text,
  is_pinned boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_updates ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read published news
CREATE POLICY "Authenticated users can read published news"
ON public.news_updates
FOR SELECT
TO authenticated
USING (is_published = true);

-- Also allow anon to read published news
CREATE POLICY "Public can read published news"
ON public.news_updates
FOR SELECT
TO anon
USING (is_published = true);
