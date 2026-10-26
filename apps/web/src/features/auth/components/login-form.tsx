'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { rules, useAppForm } from '@/hooks/form';
import { useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { toast } from '@/lib/toast';

import { useLogin } from '../api/mutations';
import { loginSchema } from '../schemas';

/** Email or username + password. Server answers become a banner; the token never reaches this code. */
export function LoginForm({ next }: { next: string }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const login = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { identifier: '', password: '' },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value, formApi }) => {
      setServerError(null);
      try {
        const { user } = await login.mutateAsync(value);
        // Next keeps visited pages alive for instant back navigation: never leave a password in the form state.
        formApi.reset();
        toast.success(t('welcome', { name: user.username }));
        router.push(next as '/discussions');
      } catch (error) {
        setServerError(messageFor(error, t));
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
      <FormAlert message={serverError} />
      <form.AppField name="identifier" validators={rules(loginSchema.shape.identifier)}>
        {(field) => <field.TextField label={t('identifier')} autoComplete="username" />}
      </form.AppField>
      <form.AppField name="password" validators={rules(loginSchema.shape.password)}>
        {(field) => <field.PasswordField label={t('password')} autoComplete="current-password" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton pendingLabel={t('loggingIn')}>{t('submitLogin')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}

function messageFor(error: unknown, t: ReturnType<typeof useTranslations<'Auth'>>): string {
  if (error instanceof ApiError) {
    if (error.code === 'INVALID_CREDENTIALS') return t('invalidCredentials');
    if (error.code === 'RATE_LIMITED') return t('rateLimited');
    if (error.code === 'BLOCKED') return t('blocked');
  }
  return t('genericError');
}
