import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { DiscussionArticleIsland } from '@/features/discussions/components/discussion-article-island';
import { DiscussionArticleSkeleton } from '@/features/discussions/components/discussion-article-skeleton';
import { DiscussionAsideIsland } from '@/features/discussions/components/discussion-aside-island';
import { getDiscussion } from '@/features/discussions/data';
import { RepliesIsland } from '@/features/replies/components/replies-island';
import { ReplyListSkeleton } from '@/features/replies/components/reply-list-skeleton';
import { getPathname, Link } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';

type Props = PageProps<'/[locale]/discussions/[slug]'>;

const DESCRIPTION_LENGTH = 160;

async function currentLocale(): Promise<AppLocale> {
  const locale = await getLocale();
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

function excerpt(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > DESCRIPTION_LENGTH
    ? `${flat.slice(0, DESCRIPTION_LENGTH - 1).trimEnd()}…`
    : flat;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, locale, t] = await Promise.all([
    params,
    currentLocale(),
    getTranslations('Errors'),
  ]);
  const discussion = await getDiscussion(slug, locale).catch(() => null);
  const href = `/discussions/${slug}` as '/discussions';
  if (!discussion) return { title: t('notFoundKicker'), robots: { index: false } };
  return {
    title: discussion.title,
    description: excerpt(discussion.content),
    alternates: {
      canonical: getPathname({ locale, href }),
      languages: Object.fromEntries([
        ...routing.locales.map((l) => [l, getPathname({ locale: l, href })]),
        ['x-default', getPathname({ locale: routing.defaultLocale, href })],
      ]),
    },
    openGraph: {
      type: 'article',
      title: discussion.title,
      description: excerpt(discussion.content),
    },
  };
}

/**
 * Static shell: breadcrumb and grid at once; article, replies and the side
 * cards stream as islands. The slug is read inside them: reading `params`
 * here would make the whole shell wait for the request.
 */
export default async function DiscussionPage({ params }: Props) {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('Discussion')]);
  const slug = params.then((p) => p.slug);

  return (
    <>
      <main id="content" className="flex min-w-0 flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/discussions" />}>
                {t('breadcrumbRoot')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('breadcrumbCurrent')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Suspense fallback={<DiscussionArticleSkeleton />}>
          <DiscussionArticleIsland slug={slug} locale={locale} />
        </Suspense>
        <Suspense fallback={<ReplyListSkeleton />}>
          <RepliesIsland slug={slug} locale={locale} />
        </Suspense>
      </main>
      <aside className="md:col-start-2 xl:col-start-3">
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-xl" />}>
          <DiscussionAsideIsland slug={slug} locale={locale} />
        </Suspense>
      </aside>
    </>
  );
}
