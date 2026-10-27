import { defaultShouldDehydrateQuery, isServer, QueryClient } from '@tanstack/react-query';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Data prefetched on the server is fresh for a minute: no refetch on hydration.
      // One quick retry, then the island shows its error: readers should not wait on backoff.
      queries: { staleTime: 60 * 1000, retry: 1, retryDelay: 500 },
      dehydrate: {
        // Pending queries travel too, so the client can await a streamed prefetch.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
        shouldRedactErrors: () => false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** Server: a new client per request. Browser: one client for the whole session. */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
