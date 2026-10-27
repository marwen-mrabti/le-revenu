import { getTranslations } from 'next-intl/server';

import { readerName } from '@/components/shared/user-avatar';
import { getCurrentUser } from '@/features/auth/data';
import { getDiscussion } from '@/features/discussions/data';
import type { AppLocale } from '@/i18n/routing';

import { ReplyCallToAction } from './reply-call-to-action';
import { ReplyForm } from './reply-form';

/**
 * The reply box: the form for a logged-in reader, a call to action for a
 * visitor. Reads the session, so it streams after the static shell; a
 * Strapi failure renders nothing here (the article island already says it).
 */
export async function ReplyBoxIsland({
  slug,
  locale,
}: {
  slug: Promise<string>;
  locale: AppLocale;
}) {
  const t = await getTranslations('Discussions');
  const path = await slug;
  const [discussion, user] = await Promise.all([
    getDiscussion(path, locale).catch(() => null),
    getCurrentUser(),
  ]);
  if (!discussion) return null;
  const authorName = discussion.author ? readerName(discussion.author) : t('anonymous');
  const currentPath = `/discussions/${path}`;
  if (!user) return <ReplyCallToAction authorName={authorName} currentPath={currentPath} />;
  return (
    <ReplyForm
      discussionId={discussion.documentId}
      discussionType={discussion.type}
      authorName={authorName}
      user={user}
      currentPath={currentPath}
    />
  );
}
