import { notFound } from 'next/navigation';

import { IslandError } from '@/components/shared/island-error';
import { getCurrentUser } from '@/features/auth/data';
import { getCategories } from '@/features/categories/data';
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
  const [result, user, categories] = await Promise.all([
    getDiscussion(await slug, locale).then(
      (discussion) => ({ discussion, error: null }),
      (error: unknown) => ({ discussion: undefined, error }),
    ),
    getCurrentUser(),
    getCategories(locale).catch(() => []),
  ]);
  if (result.discussion === undefined)
    return <IslandError error={errorCodeOfStrapi(result.error)} />;
  if (result.discussion === null) notFound();
  return (
    <DiscussionArticle
      discussion={result.discussion}
      currentUserId={user?.documentId ?? null}
      spaces={categories.map(({ documentId, name }) => ({ documentId, name }))}
    />
  );
}
