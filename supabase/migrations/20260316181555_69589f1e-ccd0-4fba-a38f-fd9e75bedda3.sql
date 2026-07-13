-- Add AI-generated flag to blog_posts
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS is_ai_generated boolean NOT NULL DEFAULT false;

-- Add AI-generated flag and more specific categories to news_updates
ALTER TABLE public.news_updates ADD COLUMN IF NOT EXISTS is_ai_generated boolean NOT NULL DEFAULT false;

-- Add interpretation_of field to blog_posts to link to gazette/notification source
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS source_notification_url text DEFAULT NULL;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS source_notification_title text DEFAULT NULL;