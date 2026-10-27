'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { Button } from '@/components/ui/button';
import { rules, useAppForm } from '@/hooks/form';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';

import { useUpdateDiscussion } from '../api/mutations';
import { CONTENT_MAX, discussionEditSchema } from '../schemas';

interface DiscussionEditFormProps {
  discussionId: string;
  initialTitle: string;
  initialContent: string;
  onSaved: () => void;
  onCancel: () => void;
}

/** Inline edit of title and content; category and type come with the full form (branch 07). */
export function DiscussionEditForm({
  discussionId,
  initialTitle,
  initialContent,
  onSaved,
  onCancel,
}: DiscussionEditFormProps) {
  const t = useTranslations('Discussion');
  const tOwner = useTranslations('Owner');
  const errorMessage = useApiErrorMessage();
  const update = useUpdateDiscussion(discussionId);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { title: initialTitle, content: initialContent },
    validators: { onSubmit: discussionEditSchema },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await update.mutateAsync(value);
        onSaved();
      } catch (error) {
        setServerError(errorMessage(error));
      }
    },
  });

  return (
    <form
      noValidate
      aria-label={tOwner('editingDiscussion')}
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel();
      }}
      className="mt-3 flex flex-col gap-4"
    >
      <FormAlert message={serverError} />
      <form.AppField name="title" validators={rules(discussionEditSchema.shape.title)}>
        {(field) => <field.TextField label={t('editTitle')} description={t('editTitleHint')} />}
      </form.AppField>
      <form.AppField name="content" validators={rules(discussionEditSchema.shape.content)}>
        {(field) => (
          <field.TextareaField label={t('editContent')} maxLength={CONTENT_MAX} rows={8} />
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
