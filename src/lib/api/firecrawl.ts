import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
  inserted?: number;
  skipped?: number;
};

export const firecrawlApi = {
  // Trigger a manual scrape run
  async triggerScrape(): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('scrape-news', {
      body: {},
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
