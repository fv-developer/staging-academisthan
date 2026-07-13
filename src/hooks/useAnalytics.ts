import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function usePageView() {
  const location = useLocation();

  useEffect(() => {
    const track = async () => {
      try {
        await supabase.from('analytics_events').insert({
          event_type: 'page_view',
          page_path: location.pathname,
          user_id: (await supabase.auth.getUser()).data.user?.id || null,
        });
      } catch {
        // Silent fail — analytics shouldn't break the app
      }
    };
    track();
  }, [location.pathname]);
}

export async function trackEvent(eventType: 'blog_read' | 'tool_use', pagePath?: string, metadata?: Record<string, any>) {
  try {
    await supabase.from('analytics_events').insert({
      event_type: eventType,
      page_path: pagePath,
      user_id: (await supabase.auth.getUser()).data.user?.id || null,
      metadata: metadata || {},
    });
  } catch {
    // Silent fail
  }
}
