import { useTranslations } from 'next-intl';

import { ContentParagraphs } from '@/components/shared/content-paragraphs';
import { RelativeTime } from '@/components/shared/relative-time';
import { readerName, UserAvatar } from '@/components/shared/user-avatar';
import type { ReplyItem as ReplyItemData } from '@/features/discussions/schemas';
import { cn } from '@/lib/utils';

const EDITED_AFTER_MS = 60_000;

interface ReplyItemProps {
  reply: ReplyItemData;
  /** documentId of the discussion's author: their replies carry the "Auteur" chip. */
  discussionAuthorId: string | null;
  highlighted?: boolean;
}

/** One reply: author line, content. */
export function ReplyItem({ reply, discussionAuthorId, highlighted = false }: ReplyItemProps) {
  const t = useTranslations('Replies');
  const author = reply.author ? readerName(reply.author) : t('anonymous');
  const isDiscussionAuthor = Boolean(
    reply.author && discussionAuthorId && reply.author.documentId === discussionAuthorId,
  );
  const edited =
    new Date(reply.updatedAt).getTime() - new Date(reply.createdAt).getTime() > EDITED_AFTER_MS;

  return (
    <article
      id={`reply-${reply.documentId}`}
      tabIndex={-1}
      aria-label={t('replyBy', { name: author })}
      className={cn(
        'scroll-mt-24 rounded-xl border border-border bg-card px-4 py-4 shadow-xs transition-shadow sm:px-5',
        highlighted && 'border-emerald-600/60 ring-1 ring-emerald-600/60',
      )}
    >
      <div className="flex items-center gap-2.5">
        <UserAvatar
          avatarUrl={reply.author?.avatarUrl}
          name={author}
          className="size-7 text-[11px]"
        />
        <div className="min-w-0 text-[13px] leading-tight">
          <p className="font-semibold text-foreground">
            {author}
            {isDiscussionAuthor ? (
              <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 align-middle text-[11px] font-bold text-brand-text">
                {t('authorChip')}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-muted-foreground">
            <RelativeTime date={reply.createdAt} />
            {edited ? <span> · {t('edited')}</span> : null}
          </p>
        </div>
      </div>
      <ContentParagraphs
        text={reply.content}
        className="mt-3 text-[15px] text-secondary-foreground"
      />
    </article>
  );
}
