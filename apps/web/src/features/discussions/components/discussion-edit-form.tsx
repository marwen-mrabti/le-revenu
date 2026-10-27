'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { Button } from '@/components/ui/button';
import { useAppForm } from '@/hooks/form';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';

import { useUpdateDiscussion } from '../api/mutations';
import { discussionEditSchema, type DiscussionInput } from '../schemas';
import { DiscussionFields, type SpaceOption } from './discussion-fields';

interface DiscussionEditFormProps {
  discussionId: string;
  initial: DiscussionInput;
  spaces: SpaceOption[];
  onSaved: () => void;
  onCancel: () => void;
}

/** Inline edit of the four fields; Escape or Annuler restores the text. */
export function DiscussionEditForm({
  discussionId,
  initial,
  spaces,
  onSaved,
  onCancel,
}: DiscussionEditFormProps) {
  const tOwner = useTranslations('Owner');
  const errorMessage = useApiErrorMessage();
  const update = useUpdateDiscussion(discussionId);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: initial,
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
      <DiscussionFields form={form} spaces={spaces} />
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
