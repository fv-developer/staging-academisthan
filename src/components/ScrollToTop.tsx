import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component ensures every page navigation starts at the top
 * - Instant scroll (no animation)
 * - No scroll position restoration
 * - Executes on every route change
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instant scroll to top - no smooth behavior
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
