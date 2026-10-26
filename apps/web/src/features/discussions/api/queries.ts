import { queryOptions } from '@tanstack/react-query';

import type { AppLocale } from '@/i18n/routing';
import { bffGet } from '@/lib/api/client';

import { discussionPageSchema, type DiscussionFilters } from '../schemas';
import { serializeFilters } from '../search-params';

/**
 * Query keys and options for discussions. The same `list()` options are used
 * by the server prefetch (with the DAL as `queryFn`) and by the client
 * (`queryFn` below, through the BFF), so both sides share one cache entry.
 */
export const discussionQueries = {
  all: () => ['discussions'] as const,
  lists: () => [...discussionQueries.all(), 'list'] as const,
  list: (filters: DiscussionFilters, locale: AppLocale) =>
    queryOptions({
      queryKey: [...discussionQueries.lists(), { ...filters, locale }] as const,
      queryFn: ({ signal }) =>
        bffGet(
          `/api/discussions?${serializeFilters({ ...filters, locale })}`,
          discussionPageSchema,
          signal,
        ),
    }),
};
