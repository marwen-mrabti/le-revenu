'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { buttonVariants } from '@/components/ui/button';
import { rules, useAppForm } from '@/hooks/form';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

import { useResetPassword } from '../api/mutations';
import { resetPasswordSchema } from '../schemas';

const fieldSchema = resetPasswordSchema.shape;

/** New password twice; the mailed code travels with it. Success logs the reader in. */
export function ResetForm({ code }: { code: string | null }) {
  const t = useTranslations('Auth');
  const errorMessage = useApiErrorMessage();
  const router = useRouter();
  const reset = useResetPassword();
  const [invalid, setInvalid] = useState(code === null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { code: code ?? '', password: '', passwordConfirmation: '' },
    validators: { onSubmit: resetPasswordSchema },
    onSubmit: async ({ value, formApi }) => {
      setServerError(null);
      try {
        const { user } = await reset.mutateAsync(value);
        formApi.reset();
        toast.success(t('resetDone', { name: user.username }));
        router.push('/discussions');
      } catch (error) {
        if (error instanceof ApiError && error.code === 'INVALID_CODE') {
          setInvalid(true);
          return;
        }
        setServerError(errorMessage(error));
      }
    },
  });

  if (invalid) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert message={t('resetInvalid')} />
        <Link
          href="/forgot-password"
          className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'h-10')}
        >
          {t('resetAskAgain')}
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <FormAlert message={serverError} />
      <form.AppField name="password" validators={rules(fieldSchema.password)}>
        {(field) => (
          <field.PasswordField
            label={t('newPassword')}
            description={t('passwordHint')}
            autoComplete="new-password"
          />
        )}
      </form.AppField>
      <form.AppField name="passwordConfirmation">
        {(field) => (
          <field.PasswordField label={t('confirmPassword')} autoComplete="new-password" />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton pendingLabel={t('saving')}>{t('resetSubmit')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
