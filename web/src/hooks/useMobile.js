import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 1024; // covers phones and portrait-orientation tablets (lg: breakpoint)

export function useMobile() {
  const [isMobile, setIsMobile] = useState(
    // Note: if SSR is ever added, guard with typeof window !== 'undefined'
    () => window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
