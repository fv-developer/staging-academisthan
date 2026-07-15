import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component ensures every page navigation starts at the top
 * - Instant scroll (no animation)
 * - No scroll position restoration
 * - Executes selectively on main route changes and sidebar/dashboard updates
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    prevPathRef.current = pathname;

    // Scroll to top only if the pathname strictly changed to a different route
    if (prevPath !== pathname) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};
