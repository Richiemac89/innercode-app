import { useEffect } from 'react';

/**
 * Custom hook to reset mobile browser zoom when a component mounts.
 * This prevents the page from opening with zoom retained from text input focus.
 * 
 * Simple approach: Just blur and scroll to top.
 * The pre-navigation blur in FloatingMenu does most of the work.
 */
export function useResetZoom() {
  useEffect(() => {
    // Blur any active input element
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Scroll to top
    window.scrollTo(0, 0);
  }, []);
}

