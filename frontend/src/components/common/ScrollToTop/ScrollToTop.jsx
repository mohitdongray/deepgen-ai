import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * 
 * Automatically scrolls the window to the top (0,0) whenever
 * the navigation route changes. Essential for a professional
 * SPA experience where scroll position is otherwise preserved.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top of the page on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // 'instant' ensures the user doesn't see a scrolling motion
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
