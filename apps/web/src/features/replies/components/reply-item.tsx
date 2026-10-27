'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { ContentParagraphs } from '@/components/shared/content-paragraphs';
import { OwnerActions } from '@/components/shared/owner-actions';
import { RelativeTime } from '@/components/shared/relative-time';
import { readerName, UserAvatar } from '@/components/shared/user-avatar';
import type { ReplyItem as ReplyItemData } from '@/features/discussions/schemas';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';
import { useRouter } from '@/i18n/navigation';
import { toast } from '@/lib/toast';

import { useDeleteReply } from '../api/mutations';
import { ReplyEditForm } from './reply-edit-form';

const EDITED_AFTER_MS = 60_000;

interface ReplyItemProps {
  reply: ReplyItemData;
  discussionId: string;
  /** documentId of the discussion's author: their replies carry the "Auteur" chip. */
  discussionAuthorId: string | null;
  /** documentId of the session's reader: their replies get the owner actions. */
  currentUserId: string | null;
}

/** One reply: author line, content; edit and delete for its author. */
export function ReplyItem({
  reply,
  discussionId,
  discussionAuthorId,
  currentUserId,
}: ReplyItemProps) {
  const t = useTranslations('Replies');
  const tOwner = useTranslations('Owner');
  const errorMessage = useApiErrorMessage();
  const router = useRouter();
  const remove = useDeleteReply(reply.documentId);
  const [editing, setEditing] = useState(false);
  const [, startRefresh] = useTransition();

  const author = reply.author ? readerName(reply.author) : t('anonymous');
  const isDiscussionAuthor = Boolean(
    reply.author && discussionAuthorId && reply.author.documentId === discussionAuthorId,
  );
  const isMine = Boolean(
    reply.author && currentUserId && reply.author.documentId === currentUserId,
  );
  const edited =
    new Date(reply.updatedAt).getTime() - new Date(reply.createdAt).getTime() > EDITED_AFTER_MS;

  async function onDelete() {
    try {
      await remove.mutateAsync({ discussion: discussionId });
      toast.success(tOwner('replyDeleted'));
      startRefresh(() => router.refresh());
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <article
      id={`reply-${reply.documentId}`}
      tabIndex={-1}
      aria-label={t('replyBy', { name: author })}
      className="scroll-mt-24 rounded-xl border border-border bg-card px-4 py-4 shadow-xs transition-shadow sm:px-5"
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
        {isMine && !editing ? (
          <OwnerActions
            subject={t('replyBy', { name: author })}
            onEdit={() => setEditing(true)}
            onDelete={onDelete}
            deleteTitle={tOwner('deleteReplyTitle')}
            deleteDescription={tOwner('deleteReplyText')}
          />
        ) : null}
      </div>
      {editing ? (
        <ReplyEditForm
          replyId={reply.documentId}
          discussionId={discussionId}
          initialContent={reply.content}
          onSaved={() => {
            setEditing(false);
            toast.success(tOwner('replySaved'));
            startRefresh(() => router.refresh());
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <ContentParagraphs
          text={reply.content}
          className="mt-3 text-[15px] text-secondary-foreground"
        />
      )}
    </article>
  );
}
