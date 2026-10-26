import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { CategoryChips } from '@/features/categories/components/category-chips';
import { SpaceCard } from '@/features/categories/components/space-card';
import { findCategory, getCategories } from '@/features/categories/data';
import { discussionQueries } from '@/features/discussions/api/queries';
import { DiscussionFilters } from '@/features/discussions/components/discussion-filters';
import { DiscussionList } from '@/features/discussions/components/discussion-list';
import { DiscussionListSkeleton } from '@/features/discussions/components/discussion-list-skeleton';
import { getDiscussions } from '@/features/discussions/data';
import { loadDiscussionFilters } from '@/features/discussions/search-params';
import { routing, type AppLocale } from '@/i18n/routing';
import { getQueryClient } from '@/lib/query/get-query-client';

type Props = PageProps<'/[locale]/discussions'>;

async function currentLocale(): Promise<AppLocale> {
  const locale = await getLocale();
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [t, locale, filters] = await Promise.all([
    getTranslations('Metadata'),
    currentLocale(),
    loadDiscussionFilters(searchParams),
  ]);
  const category = filters.category ? await findCategory(locale, filters.category) : undefined;
  const title = category ? `${category.name} · ${t('discussionsTitle')}` : t('discussionsTitle');
  return { title, description: category?.description ?? t('discussionsDescription') };
}

export default async function DiscussionsPage({ searchParams }: Props) {
  // The list is request-time data (search params, fresh Strapi read, cache timestamps):
  // declare it so the prerender keeps only the shell above the Suspense boundary.
  await connection();
  const [t, locale, filters] = await Promise.all([
    getTranslations('Discussions'),
    currentLocale(),
    loadDiscussionFilters(searchParams),
  ]);
  const [categories, category] = await Promise.all([
    getCategories(locale),
    filters.category ? findCategory(locale, filters.category) : undefined,
  ]);

  // Server-side fetch straight from Strapi; the client gets the result through the hydrated cache.
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({
    ...discussionQueries.list(filters, locale),
    queryFn: () => getDiscussions(filters, locale),
  });

  return (
    <>
      <main id="content" className="flex min-w-0 flex-col gap-4">
        <header>
          <h1 className="font-heading text-[28px] leading-tight font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-muted-foreground">{t('intro')}</p>
        </header>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<DiscussionListSkeleton />}>
            <CategoryChips categories={categories} />
            <DiscussionFilters />
            <DiscussionList />
          </Suspense>
        </HydrationBoundary>
      </main>
      <aside className="md:col-start-2 xl:col-start-3">
        <SpaceCard category={category} />
      </aside>
    </>
  );
}
