'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { FormNotice } from '@/components/form/form-notice';
import { rules, useAppForm } from '@/hooks/form';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { toast } from '@/lib/toast';

import { useLogin } from '../api/mutations';
import { loginSchema } from '../schemas';

/** Email or username + password. Server answers become a banner; the token never reaches this code. */
export function LoginForm({ next, confirmed = false }: { next: string; confirmed?: boolean }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const login = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { identifier: '', password: '' },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value, formApi }) => {
      setServerError(null);
      setUnconfirmed(null);
      try {
        const { user } = await login.mutateAsync(value);
        // Next keeps visited pages alive for instant back navigation: never leave a password in the form state.
        formApi.reset();
        toast.success(t('welcome', { name: user.username }));
        router.push(next as '/discussions');
      } catch (error) {
        if (error instanceof ApiError && error.code === 'EMAIL_NOT_CONFIRMED') {
          setUnconfirmed(value.identifier);
          return;
        }
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
      {confirmed ? <FormNotice message={t('confirmedBanner')} /> : null}
      <FormAlert message={serverError} />
      {unconfirmed ? (
        <FormAlert
          message={
            <>
              {t('notConfirmed')}{' '}
              <Link
                href={{ pathname: '/verify-email', query: { email: unconfirmed, next } }}
                className="underline"
              >
                {t('resendLink')}
              </Link>
            </>
          }
        />
      ) : null}
      <form.AppField name="identifier" validators={rules(loginSchema.shape.identifier)}>
        {(field) => <field.TextField label={t('identifier')} autoComplete="username" />}
      </form.AppField>
      <form.AppField name="password" validators={rules(loginSchema.shape.password)}>
        {(field) => <field.PasswordField label={t('password')} autoComplete="current-password" />}
      </form.AppField>
      <p className="-mt-2 text-right text-[13px]">
        <Link href="/forgot-password" className="font-semibold text-brand-text">
          {t('forgotLink')}
        </Link>
      </p>
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
