import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to scroll to top when the route changes
 * Uses smooth scrolling behavior for better user experience
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top with smooth behavior
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);
}

/**
 * Alternative hook that scrolls to top immediately (no smooth animation)
 * Useful for cases where immediate scroll is preferred
 */
export function useScrollToTopImmediate() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top immediately
    window.scrollTo(0, 0);
  }, [pathname]);
}

/**
 * Function to manually trigger scroll to top with smooth behavior
 * Can be called from event handlers
 */
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
};

/**
 * Function to manually trigger scroll to top immediately
 * Can be called from event handlers
 */
export const scrollToTopImmediate = () => {
  window.scrollTo(0, 0);
};