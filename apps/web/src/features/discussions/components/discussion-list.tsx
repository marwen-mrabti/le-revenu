'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryStates } from 'nuqs';

import type { AppLocale } from '@/i18n/routing';

import { discussionQueries } from '../api/queries';
import { discussionSearchParams, serializeFilters, toFilters } from '../search-params';
import { DiscussionCard } from './discussion-card';
import { DiscussionListEmpty } from './discussion-list-empty';
import { DiscussionPagination } from './discussion-pagination';

/**
 * Reads the filters from the URL, the data from the Query cache (seeded by
 * the server prefetch, refetched through the BFF when the URL changes).
 */
export function DiscussionList() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('Discussions');
  const [raw] = useQueryStates(discussionSearchParams);
  const filters = toFilters(raw);
  const { data } = useSuspenseQuery(discussionQueries.list(filters, locale));
  const { items, pagination } = data;

  if (items.length === 0) {
    const outOfRange = pagination.total > 0 && filters.page > pagination.pageCount;
    const hasFilters = Boolean(filters.category || filters.q || filters.sort !== 'newest');
    const backQuery = serializeFilters(outOfRange ? { ...filters, page: 1 } : {});
    let reason: 'no-data' | 'filtered' | 'out-of-range' = 'no-data';
    if (outOfRange) reason = 'out-of-range';
    else if (hasFilters) reason = 'filtered';
    return (
      <DiscussionListEmpty
        reason={reason}
        backHref={backQuery ? `/discussions?${backQuery}` : '/discussions'}
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {items.map((discussion) => (
          <DiscussionCard key={discussion.documentId} discussion={discussion} />
        ))}
      </div>
      <DiscussionPagination pagination={pagination} filters={filters} />
      <p className="text-center text-[13px] text-muted-foreground">
        {t('resultCount', { count: pagination.total })}
      </p>
    </>
  );
}
