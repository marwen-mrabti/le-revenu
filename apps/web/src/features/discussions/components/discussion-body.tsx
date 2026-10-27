'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { ContentParagraphs } from '@/components/shared/content-paragraphs';
import { OwnerActions } from '@/components/shared/owner-actions';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';
import { useRouter } from '@/i18n/navigation';
import { toast } from '@/lib/toast';

import { useDeleteDiscussion } from '../api/mutations';
import type { DiscussionInput } from '../schemas';
import { DiscussionEditForm } from './discussion-edit-form';
import type { SpaceOption } from './discussion-fields';

interface DiscussionBodyProps {
  discussion: DiscussionInput & { documentId: string; replyCount: number };
  spaces: SpaceOption[];
  isOwner: boolean;
}

/**
 * Title and content of the article, with the author's edit and delete. The
 * server component around it keeps the meta line and the author line.
 */
export function DiscussionBody({ discussion, spaces, isOwner }: DiscussionBodyProps) {
  const t = useTranslations('Owner');
  const errorMessage = useApiErrorMessage();
  const router = useRouter();
  const remove = useDeleteDiscussion(discussion.documentId);
  const [editing, setEditing] = useState(false);
  const [, startRefresh] = useTransition();

  async function onDelete() {
    try {
      await remove.mutateAsync();
      toast.success(t('discussionDeleted'));
      router.push('/discussions');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  if (editing) {
    return (
      <DiscussionEditForm
        discussionId={discussion.documentId}
        initial={{
          type: discussion.type,
          title: discussion.title,
          content: discussion.content,
          category: discussion.category,
        }}
        spaces={spaces}
        onSaved={() => {
          setEditing(false);
          toast.success(t('discussionSaved'));
          startRefresh(() => router.refresh());
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      <div className="mt-2 flex items-start gap-3">
        <h1
          id="discussion-title"
          className="font-heading text-[26px] leading-[1.2] font-bold tracking-tight sm:text-[29px]"
        >
          {discussion.title}
        </h1>
        {isOwner ? (
          <OwnerActions
            subject={discussion.title}
            onEdit={() => setEditing(true)}
            onDelete={onDelete}
            deleteTitle={t('deleteDiscussionTitle')}
            deleteDescription={t('deleteDiscussionText', { count: discussion.replyCount })}
          />
        ) : null}
      </div>
      <ContentParagraphs text={discussion.content} className="mt-4 text-secondary-foreground" />
    </>
  );
}
