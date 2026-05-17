import { useState, useEffect } from 'react';
import isMobileLib from 'is-mobile';

function isPhoneOrTablet() {
  // Modern Chromium browsers (Chrome, Edge, Opera) expose this natively
  if (navigator.userAgentData?.mobile === true) return true;
  // Safari, Firefox, and others: UA string parsing + maxTouchPoints for iPads
  return isMobileLib({ tablet: true });
}

export function useMobile() {
  const [isMobile, setIsMobile] = useState(() => isPhoneOrTablet());

  useEffect(() => {
    // Re-evaluate on orientation change in case layout needs updating
    function handleOrientationChange() {
      setIsMobile(isPhoneOrTablet());
    }
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  return isMobile;
}
