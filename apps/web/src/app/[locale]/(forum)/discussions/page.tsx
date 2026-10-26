import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { CategoryChips } from '@/features/categories/components/category-chips';
import { SpaceCard } from '@/features/categories/components/space-card';
import { findCategory, getCategories } from '@/features/categories/data';
import { routing, type AppLocale } from '@/i18n/routing';

type Props = PageProps<'/[locale]/discussions'>;

async function currentLocale(): Promise<AppLocale> {
  const locale = await getLocale();
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [t, locale, params] = await Promise.all([
    getTranslations('Metadata'),
    currentLocale(),
    searchParams,
  ]);
  const slug = firstParam(params.category);
  const category = slug ? await findCategory(locale, slug) : undefined;
  const title = category ? `${category.name} · ${t('discussionsTitle')}` : t('discussionsTitle');
  return { title, description: category?.description ?? t('discussionsDescription') };
}

/** List shell: title, spaces as chips on mobile, the space card on the right. The list itself lands in Phase C. */
export default async function DiscussionsPage({ searchParams }: Props) {
  const [t, locale, params] = await Promise.all([
    getTranslations('Discussions'),
    currentLocale(),
    searchParams,
  ]);
  const slug = firstParam(params.category);
  const [categories, category] = await Promise.all([
    getCategories(locale),
    slug ? findCategory(locale, slug) : undefined,
  ]);

  return (
    <>
      <main id="content" className="flex min-w-0 flex-col gap-4">
        <header>
          <h1 className="font-heading text-[28px] leading-tight font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-muted-foreground">{t('intro')}</p>
        </header>
        <Suspense fallback={null}>
          <CategoryChips categories={categories} />
        </Suspense>
      </main>
      <aside className="md:col-start-2 xl:col-start-3">
        <SpaceCard category={category} />
      </aside>
    </>
  );
}
