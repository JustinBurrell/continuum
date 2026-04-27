import { useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Returns onMouseEnter/onMouseLeave handlers. After the user hovers for
 * `delay` ms (default 150ms) the query is prefetched. Fast mouse-overs
 * (e.g. moving across the nav) are ignored, avoiding wasted requests.
 */
export function usePrefetchOnIntent(queryKey, queryFn, delay = 150) {
  const queryClient = useQueryClient();
  const timer = useRef(null);

  const onMouseEnter = useCallback(() => {
    timer.current = setTimeout(() => {
      queryClient.prefetchQuery({ queryKey, queryFn });
    }, delay);
  }, [queryKey, queryFn, delay]);

  const onMouseLeave = useCallback(() => {
    clearTimeout(timer.current);
  }, []);

  return { onMouseEnter, onMouseLeave };
}
