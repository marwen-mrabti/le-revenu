'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { FormNotice } from '@/components/form/form-notice';
import { rules, useAppForm } from '@/hooks/form';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';

import { useForgotPassword } from '../api/mutations';
import { forgotPasswordSchema } from '../schemas';

/** Email in, one sentence out, whatever the server knows about that address. */
export function ForgotForm() {
  const t = useTranslations('Auth');
  const errorMessage = useApiErrorMessage();
  const forgot = useForgotPassword();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onSubmit: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await forgot.mutateAsync(value);
        setSentTo(value.email);
      } catch (error) {
        setServerError(errorMessage(error));
      }
    },
  });

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <FormNotice message={t('forgotSent', { email: sentTo })} />
        <p className="text-sm text-muted-foreground">{t('forgotSentHint')}</p>
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
      <form.AppField name="email" validators={rules(forgotPasswordSchema.shape.email)}>
        {(field) => <field.TextField label={t('email')} type="email" autoComplete="email" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton pendingLabel={t('sending')}>{t('forgotSubmit')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
