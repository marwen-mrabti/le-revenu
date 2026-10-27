import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { connection } from 'next/server';

import { Island } from '@/components/shared/island';
import { IslandError } from '@/components/shared/island-error';
import { errorCodeOfStrapi } from '@/lib/api/error-codes';
import type { AppLocale } from '@/i18n/routing';
import { getQueryClient } from '@/lib/query/get-query-client';

import { discussionQueries } from '../api/queries';
import { getDiscussions } from '../data';
import { loadDiscussionFilters } from '../search-params';
import { DiscussionList } from './discussion-list';
import { DiscussionListSkeleton } from './discussion-list-skeleton';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * The list section: reads the URL, fetches the page from Strapi on the
 * server, hands it to the client cache. A Strapi failure is rendered here
 * as a contained error; later client refetches (filters) fail inside the
 * Island boundary. The page around never waits for this.
 */
export async function DiscussionsIsland({
  searchParams,
  locale,
}: {
  searchParams: SearchParams;
  locale: AppLocale;
}) {
  await connection();
  const filters = await loadDiscussionFilters(searchParams);
  const queryClient = getQueryClient();
  const options = discussionQueries.list(filters, locale);
  await queryClient.prefetchQuery({ ...options, queryFn: () => getDiscussions(filters, locale) });

  const state = queryClient.getQueryState(options.queryKey);
  if (state?.status === 'error') {
    return <IslandError error={errorCodeOfStrapi(state.error)} />;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Island fallback={<DiscussionListSkeleton />}>
        <DiscussionList />
      </Island>
    </HydrationBoundary>
  );
}
