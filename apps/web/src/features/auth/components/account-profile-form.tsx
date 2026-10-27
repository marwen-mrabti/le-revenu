'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { FormNotice } from '@/components/form/form-notice';
import { rules, useAppForm } from '@/hooks/form';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';
import { ApiError } from '@/lib/api/client';

import { useUpdateAccount } from '../api/mutations';
import { accountSchema, type SessionUser } from '../schemas';

/** Display name and username. Email is shown, not editable (an evolution with its own confirmation). */
export function AccountProfileForm({ user }: { user: SessionUser }) {
  const t = useTranslations('Account');
  const tAuth = useTranslations('Auth');
  const errorMessage = useApiErrorMessage();
  const update = useUpdateAccount();
  const [notice, setNotice] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { username: user.username, displayName: user.displayName ?? '' },
    validators: { onSubmit: accountSchema },
    onSubmit: async ({ value, formApi }) => {
      setNotice(null);
      setServerError(null);
      try {
        await update.mutateAsync(value);
        setNotice(t('profileSaved'));
      } catch (error) {
        if (error instanceof ApiError && error.code === 'ALREADY_TAKEN') {
          formApi.setFieldMeta('username', (meta) => ({
            ...meta,
            isBlurred: true,
            errorMap: { ...meta.errorMap, onSubmit: 'alreadyTaken' },
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
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <FormNotice message={notice} />
      <FormAlert message={serverError} />
      <div className="grid gap-4 sm:grid-cols-2">
        <form.AppField name="displayName" validators={rules(accountSchema.shape.displayName)}>
          {(field) => (
            <field.TextField
              label={t('displayName')}
              description={t('displayNameHint')}
              autoComplete="name"
            />
          )}
        </form.AppField>
        <form.AppField name="username" validators={rules(accountSchema.shape.username)}>
          {(field) => (
            <field.TextField
              label={tAuth('username')}
              description={tAuth('usernameHint')}
              autoComplete="username"
            />
          )}
        </form.AppField>
      </div>
      <p className="text-[12.5px] text-muted-foreground">
        {t('emailLabel')} <b className="text-foreground">{user.email}</b> · {t('emailHint')}
      </p>
      <div className="flex justify-end">
        <form.AppForm>
          <form.SubmitButton pendingLabel={tAuth('saving')} className="sm:w-auto sm:px-5">
            {t('save')}
          </form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  );
}
