
-- Blog automation fields
ALTER TABLE public.blog_posts 
  ADD COLUMN IF NOT EXISTS source_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_model text,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'approved';

-- Automation runs log
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  items_created integer NOT NULL DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

GRANT SELECT ON public.automation_runs TO authenticated;
GRANT ALL ON public.automation_runs TO service_role;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view automation runs"
  ON public.automation_runs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_automation_runs_function_started 
  ON public.automation_runs(function_name, started_at DESC);

-- Enable pg_net for cron HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
