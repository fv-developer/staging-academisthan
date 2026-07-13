
-- Tighten analytics INSERT policy
DROP POLICY "Anyone can insert analytics" ON public.analytics_events;

CREATE POLICY "Anyone can insert analytics"
ON public.analytics_events FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_type IN ('page_view', 'tool_use', 'blog_read')
  AND length(COALESCE(page_path, '')) <= 500
);
