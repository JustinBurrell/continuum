import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // matches Tailwind md: breakpoint

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
