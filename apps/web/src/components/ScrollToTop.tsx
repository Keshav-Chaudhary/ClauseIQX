'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global ScrollToTop component
 * Ensures that whenever the route / pathname changes, the scroll position
 * is immediately and reliably reset to the top across the window, document,
 * and any nested main scroll containers.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Reset standard browser window and document scrolling
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
      document.documentElement.scrollLeft = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
    }

    // 2. Reset any nested application scroll containers
    const scrollContainers = [
      document.getElementById('main-content'),
      document.getElementById('main-tab-content'),
      document.querySelector('main'),
    ];

    scrollContainers.forEach((container) => {
      if (container) {
        container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        container.scrollTop = 0;
      }
    });

    // 3. Post-render animation frame fallback to handle any dynamic Next.js DOM updates
    const rafId = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      const tabContent = document.getElementById('main-tab-content');
      if (tabContent) tabContent.scrollTop = 0;
      const mainContent = document.getElementById('main-content');
      if (mainContent) mainContent.scrollTop = 0;
    });

    return () => cancelAnimationFrame(rafId);
  }, [pathname]);

  return null;
}
