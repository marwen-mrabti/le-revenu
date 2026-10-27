'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { Button } from '@/components/ui/button';
import { rules, useAppForm } from '@/hooks/form';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';

import { useUpdateReply } from '../api/mutations';
import { REPLY_MAX, replyEditSchema } from '../schemas';

interface ReplyEditFormProps {
  replyId: string;
  discussionId: string;
  initialContent: string;
  onSaved: () => void;
  onCancel: () => void;
}

/** Inline edit of one reply: same rules as a new one, Escape or Annuler restores the text. */
export function ReplyEditForm({
  replyId,
  discussionId,
  initialContent,
  onSaved,
  onCancel,
}: ReplyEditFormProps) {
  const t = useTranslations('Replies');
  const tOwner = useTranslations('Owner');
  const errorMessage = useApiErrorMessage();
  const update = useUpdateReply(replyId);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { content: initialContent },
    validators: { onSubmit: replyEditSchema.pick({ content: true }) },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await update.mutateAsync({ content: value.content, discussion: discussionId });
        onSaved();
      } catch (error) {
        setServerError(errorMessage(error));
      }
    },
  });

  return (
    <form
      noValidate
      aria-label={tOwner('editingReply')}
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel();
      }}
      className="mt-3 flex flex-col gap-3"
    >
      <FormAlert message={serverError} />
      <form.AppField name="content" validators={rules(replyEditSchema.shape.content)}>
        {(field) => (
          <field.TextareaField label={t('yourReply')} hideLabel maxLength={REPLY_MAX} autoFocus />
        )}
      </form.AppField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {tOwner('cancel')}
        </Button>
        <form.AppForm>
          <form.SubmitButton pendingLabel={tOwner('saving')} className="w-auto px-5">
            {tOwner('save')}
          </form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  );
}
