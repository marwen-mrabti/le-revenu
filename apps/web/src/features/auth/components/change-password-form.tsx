'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { FormNotice } from '@/components/form/form-notice';
import { rules, useAppForm } from '@/hooks/form';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';
import { ApiError } from '@/lib/api/client';

import { useChangePassword } from '../api/mutations';
import { changePasswordSchema } from '../schemas';

const fieldSchema = changePasswordSchema.shape;

/** Current password, new one twice. Strapi issues a fresh token on success; the cookie follows. */
export function ChangePasswordForm() {
  const t = useTranslations('Account');
  const tAuth = useTranslations('Auth');
  const errorMessage = useApiErrorMessage();
  const change = useChangePassword();
  const [notice, setNotice] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { currentPassword: '', password: '', passwordConfirmation: '' },
    validators: { onSubmit: changePasswordSchema },
    onSubmit: async ({ value, formApi }) => {
      setNotice(null);
      setServerError(null);
      try {
        await change.mutateAsync(value);
        formApi.reset();
        setNotice(t('passwordChanged'));
      } catch (error) {
        if (error instanceof ApiError && error.fieldErrors) {
          for (const [name, keys] of Object.entries(error.fieldErrors)) {
            formApi.setFieldMeta(name as 'currentPassword' | 'password', (meta) => ({
              ...meta,
              isBlurred: true,
              errorMap: { ...meta.errorMap, onSubmit: keys[0] },
            }));
          }
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
      <div className="grid gap-4 sm:grid-cols-3">
        <form.AppField name="currentPassword" validators={rules(fieldSchema.currentPassword)}>
          {(field) => (
            <field.PasswordField label={t('currentPassword')} autoComplete="current-password" />
          )}
        </form.AppField>
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
            {t('changePassword')}
          </form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  );
}
