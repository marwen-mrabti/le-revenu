'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { buttonVariants } from '@/components/ui/button';
import { useAppForm } from '@/hooks/form';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

import { useCreateDiscussion } from '../api/mutations';
import { discussionInputSchema } from '../schemas';
import { DiscussionFields, discussionFormDefaults, type SpaceOption } from './discussion-fields';

interface DiscussionFormProps {
  spaces: SpaceOption[];
  /** documentId of the space preselected from `?category=`, empty otherwise. */
  initialCategory: string;
}

/** The create form: valid → Strapi → the new discussion's page with a toast. */
export function DiscussionForm({ spaces, initialCategory }: DiscussionFormProps) {
  const t = useTranslations('DiscussionNew');
  const errorMessage = useApiErrorMessage();
  const router = useRouter();
  const create = useCreateDiscussion();
  const [serverError, setServerError] = useState<React.ReactNode | null>(null);

  const form = useAppForm({
    defaultValues: { ...discussionFormDefaults, category: initialCategory },
    validators: { onSubmit: discussionInputSchema },
    onSubmit: async ({ value, formApi }) => {
      setServerError(null);
      try {
        const { discussion } = await create.mutateAsync(value);
        toast.success(t('published'));
        formApi.reset();
        router.push(`/discussions/${discussion.slug}` as '/discussions');
      } catch (error) {
        if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') {
          setServerError(
            <>
              {t('sessionExpired')}{' '}
              <Link
                href={{ pathname: '/login', query: { next: '/discussions/new' } }}
                className="underline"
              >
                {t('sessionExpiredLink')}
              </Link>
            </>,
          );
          return;
        }
        if (error instanceof ApiError && error.fieldErrors?.category) {
          formApi.setFieldMeta('category', (meta) => ({
            ...meta,
            isBlurred: true,
            errorMap: { ...meta.errorMap, onSubmit: 'categoryUnknown' },
          }));
          return;
        }
        setServerError(errorMessage(error));
      }
    },
  });

  return (
    <form
      noValidate
      aria-labelledby="new-discussion-title"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <FormAlert message={serverError} />
      <DiscussionFields form={form} spaces={spaces} />
      <div className="flex flex-wrap justify-end gap-2.5">
        <Link
          href="/discussions"
          className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'h-10')}
        >
          {t('cancel')}
        </Link>
        <form.AppForm>
          <form.SubmitButton pendingLabel={t('publishing')} className="sm:w-auto sm:px-6">
            {t('publish')}
          </form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  );
}
