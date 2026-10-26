import { defaultShouldDehydrateQuery, isServer, QueryClient } from '@tanstack/react-query';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Data prefetched on the server is fresh for a minute: no refetch on hydration.
      queries: { staleTime: 60 * 1000 },
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
