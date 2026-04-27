import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Marketing pages scroll window; app pages scroll <main> (overflow-y-auto in AppLayout)
    window.scrollTo(0, 0);
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }, [pathname]);

  return null;
}
