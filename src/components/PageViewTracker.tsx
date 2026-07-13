import { usePageView } from '@/hooks/useAnalytics';

export function PageViewTracker() {
  usePageView();
  return null;
}
