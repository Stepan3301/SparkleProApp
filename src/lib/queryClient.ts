import { QueryClient } from '@tanstack/react-query';

// ✅ Optimized React Query configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 2 minutes
      staleTime: 1000 * 60 * 2, // 2 minutes
      
      // Cached data is kept for 10 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      
      // Retry failed requests
      retry: 1,
      
      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (good for returning users)
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});
