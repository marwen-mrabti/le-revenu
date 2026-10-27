import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NewDiscussionIsland } from '@/features/discussions/components/new-discussion-island';
import { Link } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';

type Props = PageProps<'/[locale]/discussions/new'>;

async function currentLocale(): Promise<AppLocale> {
  const locale = await getLocale();
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('newDiscussionTitle'), robots: { index: false } };
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-hidden="true">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-44 w-full" />
    </div>
  );
}

/** Static shell (breadcrumb, card, tips); the form streams once the session and the spaces are read. */
export default async function NewDiscussionPage({ searchParams }: Props) {
  const [t, tDisc, locale] = await Promise.all([
    getTranslations('DiscussionNew'),
    getTranslations('Discussion'),
    currentLocale(),
  ]);

  return (
    <>
      <main id="content" className="flex min-w-0 flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/discussions" />}>
                {tDisc('breadcrumbRoot')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <section
          aria-labelledby="new-discussion-title"
          className="rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6"
        >
          <h1
            id="new-discussion-title"
            className="font-heading text-[26px] leading-tight font-bold tracking-tight"
          >
            {t('title')}
          </h1>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">{t('intro')}</p>
          <Suspense fallback={<FormSkeleton />}>
            <NewDiscussionIsland searchParams={searchParams} locale={locale} />
          </Suspense>
        </section>
      </main>
      <aside className="md:col-start-2 xl:col-start-3">
        <Card>
          <CardHeader>
            <CardDescription className="text-xs font-semibold tracking-wider uppercase">
              {t('tipsTitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-4 text-sm text-secondary-foreground">
              <li>{t('tip1')}</li>
              <li>{t('tip2')}</li>
              <li>{t('tip3')}</li>
            </ul>
          </CardContent>
        </Card>
      </aside>
    </>
  );
}
