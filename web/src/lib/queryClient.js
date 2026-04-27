import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds — fresh enough for multi-user; mutations invalidate explicitly for instant updates
      gcTime: 30 * 60_000, // 30 minutes — data survives a full browsing session; socket events keep it fresh
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 429) return false;
        return failureCount < 2;
      },
    },
  },
});

export default queryClient;
