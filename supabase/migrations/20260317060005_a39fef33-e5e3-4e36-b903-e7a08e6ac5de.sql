
-- Add content lifecycle and job detail columns to news_updates
ALTER TABLE public.news_updates 
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_date timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_category text NOT NULL DEFAULT 'news',
  ADD COLUMN IF NOT EXISTS job_sub_category text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS organization text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS location text DEFAULT NULL;

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_news_expires_at ON public.news_updates (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_news_retention ON public.news_updates (retention_category);
CREATE INDEX IF NOT EXISTS idx_news_last_date ON public.news_updates (last_date) WHERE last_date IS NOT NULL;

-- Update existing records with appropriate retention categories
UPDATE public.news_updates SET retention_category = 'regulatory' WHERE category IN ('gazette', 'ugc_aicte', 'nep_update', 'autonomous');
UPDATE public.news_updates SET retention_category = 'jobs' WHERE category IN ('jobs', 'grant', 'fellowship');
UPDATE public.news_updates SET retention_category = 'news' WHERE retention_category NOT IN ('regulatory', 'jobs');
