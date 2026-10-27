import { getTranslations } from 'next-intl/server';

import { IslandError } from '@/components/shared/island-error';
import { readerName } from '@/components/shared/user-avatar';
import { getDiscussion } from '@/features/discussions/data';
import type { AppLocale } from '@/i18n/routing';
import { errorCodeOfStrapi } from '@/lib/api/error-codes';

import { ReplyList } from './reply-list';

/** The replies section, from the same cached read as the article; nothing when the discussion is unknown (the article island answers 404). */
export async function RepliesIsland({
  slug,
  locale,
}: {
  slug: Promise<string>;
  locale: AppLocale;
}) {
  const t = await getTranslations('Discussions');
  const result = await getDiscussion(await slug, locale).then(
    (discussion) => ({ discussion, error: null }),
    (error: unknown) => ({ discussion: undefined, error }),
  );
  if (result.discussion === undefined)
    return <IslandError error={errorCodeOfStrapi(result.error)} />;
  if (result.discussion === null) return null;
  const authorName = result.discussion.author
    ? readerName(result.discussion.author)
    : t('anonymous');
  return <ReplyList discussion={result.discussion} authorName={authorName} />;
}
