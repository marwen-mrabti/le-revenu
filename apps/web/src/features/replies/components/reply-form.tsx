'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useTransition } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { readerName, UserAvatar } from '@/components/shared/user-avatar';
import type { SessionUser } from '@/features/auth/schemas';
import { rules, useAppForm } from '@/hooks/form';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';

import { useCreateReply } from '../api/mutations';
import { REPLY_MAX, replyInputSchema } from '../schemas';

interface ReplyFormProps {
  discussionId: string;
  discussionType: 'question' | 'discussion';
  /** Name of the discussion's author, for the placeholder. */
  authorName: string;
  user: SessionUser;
  /** Where the login link comes back to when the session has expired. */
  currentPath: string;
}

const HIGHLIGHT_MS = 2000;

/**
 * The reader's reply box. After a post the server tree is refreshed so the
 * cached read re-renders with the new reply, which is then focused and lit up.
 */
export function ReplyForm({
  discussionId,
  discussionType,
  authorName,
  user,
  currentPath,
}: ReplyFormProps) {
  const t = useTranslations('Replies');
  const errorMessage = useApiErrorMessage();
  const router = useRouter();
  const create = useCreateReply();
  const [serverError, setServerError] = useState<React.ReactNode | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const postedId = useRef<string | null>(null);

  // Once the refreshed tree is in, the new reply exists in the DOM: focus it and light it up.
  useEffect(() => {
    if (isRefreshing || !postedId.current) return;
    const element = document.getElementById(`reply-${postedId.current}`);
    postedId.current = null;
    if (!element) return;
    element.scrollIntoView({ block: 'center', behavior: 'smooth' });
    element.focus({ preventScroll: true });
    element.classList.add('border-emerald-600/60', 'ring-1', 'ring-emerald-600/60');
    const timer = setTimeout(
      () => element.classList.remove('border-emerald-600/60', 'ring-1', 'ring-emerald-600/60'),
      HIGHLIGHT_MS,
    );
    return () => clearTimeout(timer);
  }, [isRefreshing]);

  const form = useAppForm({
    defaultValues: { content: '' },
    validators: { onSubmit: replyInputSchema.pick({ content: true }) },
    onSubmit: async ({ value, formApi }) => {
      setServerError(null);
      try {
        const { reply } = await create.mutateAsync({ ...value, discussion: discussionId });
        formApi.reset();
        postedId.current = reply.documentId;
        startRefresh(() => router.refresh());
      } catch (error) {
        if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') {
          setServerError(
            <>
              {t('sessionExpired')}{' '}
              <Link
                href={{ pathname: '/login', query: { next: currentPath } }}
                className="underline"
              >
                {t('sessionExpiredLink')}
              </Link>
            </>,
          );
          return;
        }
        if (error instanceof ApiError && error.code === 'NOT_FOUND') {
          setServerError(t('gone'));
          return;
        }
        setServerError(errorMessage(error));
      }
    },
  });

  return (
    <form
      noValidate
      aria-labelledby="reply-form-title"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-4 shadow-xs sm:px-5"
    >
      <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
        <UserAvatar
          avatarUrl={user.avatarUrl}
          name={readerName(user)}
          className="size-7 text-[11px]"
        />
        <p id="reply-form-title">
          {t.rich('replyAs', {
            name: readerName(user),
            b: (chunks) => <b className="text-foreground">{chunks}</b>,
          })}
        </p>
      </div>
      <FormAlert message={serverError} />
      <form.AppField name="content" validators={rules(replyInputSchema.shape.content)}>
        {(field) => (
          <field.TextareaField
            label={t('yourReply')}
            hideLabel
            maxLength={REPLY_MAX}
            placeholder={
              discussionType === 'question'
                ? t('placeholderQuestion', { name: authorName })
                : t('placeholderDiscussion')
            }
          />
        )}
      </form.AppField>
      <div className="flex justify-end">
        <form.AppForm>
          <form.SubmitButton pendingLabel={t('posting')} className="sm:w-auto sm:px-5">
            {t('submit')}
          </form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  );
}
