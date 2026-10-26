'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { rules, useAppForm } from '@/hooks/form';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { toast } from '@/lib/toast';

import { useRegister } from '../api/mutations';
import { registerSchema } from '../schemas';

/** Username, email, password. A taken email or username comes back on the email field. */
export function RegisterForm({ next }: { next: string }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const register = useRegister();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { username: '', email: '', password: '' },
    validators: { onSubmit: registerSchema },
    onSubmit: async ({ value, formApi }) => {
      setServerError(null);
      try {
        const { user } = await register.mutateAsync(value);
        // Next keeps visited pages alive for instant back navigation: never leave a password in the form state.
        formApi.reset();
        toast.success(t('welcome', { name: user.username }));
        router.push(next as '/discussions');
      } catch (error) {
        if (error instanceof ApiError && error.code === 'ALREADY_TAKEN') {
          formApi.setFieldMeta('email', (meta) => ({
            ...meta,
            isBlurred: true,
            errorMap: { ...meta.errorMap, onSubmit: 'alreadyTaken' },
          }));
          return;
        }
        if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
          setServerError(t('rateLimited'));
          return;
        }
        setServerError(t('genericError'));
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
      <form.AppField name="username" validators={rules(registerSchema.shape.username)}>
        {(field) => (
          <field.TextField
            label={t('username')}
            description={t('usernameHint')}
            autoComplete="username"
          />
        )}
      </form.AppField>
      <form.AppField name="email" validators={rules(registerSchema.shape.email)}>
        {(field) => <field.TextField label={t('email')} type="email" autoComplete="email" />}
      </form.AppField>
      <form.AppField name="password" validators={rules(registerSchema.shape.password)}>
        {(field) => (
          <field.PasswordField
            label={t('password')}
            description={t('passwordHint')}
            autoComplete="new-password"
          />
        )}
      </form.AppField>
      <p className="text-xs text-muted-foreground">
        {t.rich('legal', {
          link: (chunks) => (
            <Link href="/discussions" className="font-semibold text-brand-text">
              {chunks}
            </Link>
          ),
        })}
      </p>
      <form.AppForm>
        <form.SubmitButton pendingLabel={t('registering')}>{t('submitRegister')}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
