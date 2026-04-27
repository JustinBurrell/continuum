import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { enqueuePrefetch } from '@/lib/prefetchQueue';

/**
 * Attach to a container ref. When the element enters the viewport,
 * the query is enqueued into the sequential prefetch queue at idle priority.
 *
 * queryKey must be memoized at the call site (useMemo or stable constant)
 * so the derived keyStr stays stable across renders.
 */
export function usePrefetchOnView(queryKey, queryFn, { threshold = 0.1 } = {}) {
  const queryClient = useQueryClient();
  const ref = useRef(null);
  const keyStr = queryKey.join(':');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        enqueuePrefetch(keyStr, () => queryClient.prefetchQuery({ queryKey, queryFn }));
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [keyStr]);

  return ref;
}
