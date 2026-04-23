import { QueryClient } from "@tanstack/react-query";

export const QUERY_TIMES = {
  analyticsStaleTime: 5 * 60 * 1000,
  districtTopologyStaleTime: 30 * 60 * 1000,
  precinctTopologyStaleTime: 60 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
};

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_TIMES.analyticsStaleTime,
        gcTime: QUERY_TIMES.gcTime,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
    },
  });
}

export const queryClient = createAppQueryClient();
