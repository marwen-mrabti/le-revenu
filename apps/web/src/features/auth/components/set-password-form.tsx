'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { rules, useAppForm } from '@/hooks/form';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';

import { useSetPassword } from '../api/mutations';
import { setPasswordSchema } from '../schemas';

const fieldSchema = setPasswordSchema.shape;

/** New password twice, no current one: the account was created through Google. */
export function SetPasswordForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations('Account');
  const tAuth = useTranslations('Auth');
  const errorMessage = useApiErrorMessage();
  const set = useSetPassword();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { password: '', passwordConfirmation: '' },
    validators: { onSubmit: setPasswordSchema },
    onSubmit: async ({ value, formApi }) => {
      setServerError(null);
      try {
        await set.mutateAsync(value);
        formApi.reset();
        onDone();
      } catch (error) {
        setServerError(errorMessage(error));
      }
    },
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-secondary-foreground">{t('setPasswordIntro')}</p>
      <FormAlert message={serverError} />
      <div className="grid gap-4 sm:grid-cols-2">
        <form.AppField name="password" validators={rules(fieldSchema.password)}>
          {(field) => (
            <field.PasswordField
              label={tAuth('newPassword')}
              description={tAuth('passwordHint')}
              autoComplete="new-password"
            />
          )}
        </form.AppField>
        <form.AppField name="passwordConfirmation">
          {(field) => (
            <field.PasswordField label={tAuth('confirmPassword')} autoComplete="new-password" />
          )}
        </form.AppField>
      </div>
      <div className="flex justify-end">
        <form.AppForm>
          <form.SubmitButton pendingLabel={tAuth('saving')} className="sm:w-auto sm:px-5">
            {t('setPassword')}
          </form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  );
}
