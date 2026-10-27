import { notFound } from 'next/navigation';

import { IslandError } from '@/components/shared/island-error';
import type { AppLocale } from '@/i18n/routing';
import { errorCodeOfStrapi } from '@/lib/api/error-codes';

import { getDiscussion } from '../data';
import { DiscussionArticle } from './discussion-article';

/** The article section: cached read; unknown slug → the locale 404 page; Strapi down → contained error. */
export async function DiscussionArticleIsland({
  slug,
  locale,
}: {
  slug: Promise<string>;
  locale: AppLocale;
}) {
  const result = await getDiscussion(await slug, locale).then(
    (discussion) => ({ discussion, error: null }),
    (error: unknown) => ({ discussion: undefined, error }),
  );
  if (result.discussion === undefined)
    return <IslandError error={errorCodeOfStrapi(result.error)} />;
  if (result.discussion === null) notFound();
  return <DiscussionArticle discussion={result.discussion} />;
}
