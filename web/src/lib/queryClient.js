import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds — fresh enough for multi-user; mutations invalidate explicitly for instant updates
      retry: (failureCount, error) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) return false;
        return failureCount < 2;
      },
    },
  },
});

export default queryClient;
