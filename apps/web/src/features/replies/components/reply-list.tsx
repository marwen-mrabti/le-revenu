import { useTranslations } from 'next-intl';

import type { DiscussionDetail } from '@/features/discussions/schemas';

import { RepliesEmpty } from './replies-empty';
import { ReplyItem } from './reply-item';

/** The replies in chronological order under their count. */
export function ReplyList({
  discussion,
  authorName,
  currentUserId,
}: {
  discussion: DiscussionDetail;
  authorName: string;
  currentUserId: string | null;
}) {
  const t = useTranslations('Replies');
  const count = discussion.replies.length;
  if (count === 0) return <RepliesEmpty authorName={authorName} />;
  return (
    <section aria-labelledby="replies-title" className="flex flex-col gap-3">
      <h2 id="replies-title" className="text-[17px] font-bold">
        {t('count', { count })}
      </h2>
      {discussion.replies.map((reply) => (
        <ReplyItem
          key={reply.documentId}
          reply={reply}
          discussionId={discussion.documentId}
          discussionAuthorId={discussion.author?.documentId ?? null}
          currentUserId={currentUserId}
        />
      ))}
    </section>
  );
}
