import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — analytical data refreshes on next mount after 5 min
      gcTime: 30 * 60 * 1000,     // 30 min — matches backend Caffeine TTL
      retry: 1,
      refetchOnWindowFocus: false, // data is read-only; no background refetch needed
    },
  },
});
