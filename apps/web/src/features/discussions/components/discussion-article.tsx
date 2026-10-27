import { getTranslations } from 'next-intl/server';

import { RelativeTime } from '@/components/shared/relative-time';
import { readerName, UserAvatar } from '@/components/shared/user-avatar';
import { Badge } from '@/components/ui/badge';

import type { DiscussionDetail } from '../schemas';
import { DiscussionBody } from './discussion-body';

/** The discussion itself: category, type, title, author line, content; edit and delete for its author. */
export async function DiscussionArticle({
  discussion,
  currentUserId,
}: {
  discussion: DiscussionDetail;
  currentUserId: string | null;
}) {
  const t = await getTranslations('Discussions');
  const author = discussion.author ? readerName(discussion.author) : t('anonymous');
  const color = discussion.category?.color ?? undefined;
  const isOwner = Boolean(
    discussion.author && currentUserId && discussion.author.documentId === currentUserId,
  );

  return (
    <article
      aria-labelledby="discussion-title"
      className="rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
        {discussion.category ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-secondary-foreground">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-muted-foreground"
              style={color ? { backgroundColor: color } : undefined}
            />
            {discussion.category.name}
          </span>
        ) : null}
        {discussion.type === 'question' ? (
          <Badge variant="secondary" className="rounded-full text-[11.5px]">
            {t('typeQuestion')}
          </Badge>
        ) : null}
      </div>
      <DiscussionBody
        discussion={{
          documentId: discussion.documentId,
          title: discussion.title,
          content: discussion.content,
          replyCount: discussion.replies.length,
        }}
        isOwner={isOwner}
      />
      <div className="mt-3.5 flex items-center gap-2.5">
        <UserAvatar
          avatarUrl={discussion.author?.avatarUrl}
          name={author}
          className="size-9 text-[13px]"
        />
        <div className="min-w-0 text-[13px] leading-tight">
          <p className="font-semibold text-foreground">{author}</p>
          <p className="mt-0.5 text-muted-foreground">
            <RelativeTime date={discussion.createdAt} />
          </p>
        </div>
      </div>
    </article>
  );
}
