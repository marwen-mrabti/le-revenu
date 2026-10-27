import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { CategoryChipsIsland } from '@/features/categories/components/category-chips-island';
import { SpaceCardIsland } from '@/features/categories/components/space-card-island';
import { findCategory } from '@/features/categories/data';
import { DiscussionFilters } from '@/features/discussions/components/discussion-filters';
import { DiscussionFiltersSkeleton } from '@/features/discussions/components/discussion-filters-skeleton';
import { DiscussionListSkeleton } from '@/features/discussions/components/discussion-list-skeleton';
import { DiscussionsIsland } from '@/features/discussions/components/discussions-island';
import { loadDiscussionFilters } from '@/features/discussions/search-params';
import { routing, type AppLocale } from '@/i18n/routing';
import { Skeleton } from '@/components/ui/skeleton';

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
  const category = filters.category
    ? await findCategory(locale, filters.category).catch(() => undefined)
    : undefined;
  const title = category ? `${category.name} · ${t('discussionsTitle')}` : t('discussionsTitle');
  return { title, description: category?.description ?? t('discussionsDescription') };
}

/**
 * Static shell (title, intro, filter chrome, grid) rendered at once; each
 * data section is an island that loads and fails on its own.
 */
export default async function DiscussionsPage({ searchParams }: Props) {
  const [t, locale] = await Promise.all([getTranslations('Discussions'), currentLocale()]);

  return (
    <>
      <main id="content" className="flex min-w-0 flex-col gap-4">
        <header>
          <h1 className="font-heading text-[28px] leading-tight font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-muted-foreground">{t('intro')}</p>
        </header>
        <Suspense fallback={<Skeleton className="h-8 w-full md:hidden" />}>
          <CategoryChipsIsland locale={locale} />
        </Suspense>
        <Suspense fallback={<DiscussionFiltersSkeleton />}>
          <DiscussionFilters />
        </Suspense>
        <Suspense fallback={<DiscussionListSkeleton />}>
          <DiscussionsIsland searchParams={searchParams} locale={locale} />
        </Suspense>
      </main>
      <aside className="md:col-start-2 xl:col-start-3">
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-xl" />}>
          <SpaceCardIsland searchParams={searchParams} locale={locale} />
        </Suspense>
      </aside>
    </>
  );
}
