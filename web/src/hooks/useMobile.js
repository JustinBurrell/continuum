import { useState, useEffect } from 'react';
import isMobileLib from 'is-mobile';

function isPhoneOrTablet() {
  // Modern Chromium browsers (Chrome, Edge, Opera) expose this natively
  if (navigator.userAgentData?.mobile === true) return true;
  // iPadOS 13+ reports UA as Macintosh but has multiple touch points; real Macs have 0
  if (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1) return true;
  // All other phones and tablets via UA string parsing
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
