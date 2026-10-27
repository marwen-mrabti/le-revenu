'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FormNotice } from '@/components/form/form-notice';

import { ChangePasswordForm } from './change-password-form';
import { SetPasswordForm } from './set-password-form';

/**
 * One card, two forms: "set" while the account has no password (Google sign-up),
 * "change" afterwards. The switch happens in place once the first password is saved.
 */
export function PasswordCard({ hasPassword: initial }: { hasPassword: boolean }) {
  const t = useTranslations('Account');
  const [hasPassword, setHasPassword] = useState(initial);
  const [justSet, setJustSet] = useState(false);

  if (!hasPassword) {
    return (
      <SetPasswordForm
        onDone={() => {
          setHasPassword(true);
          setJustSet(true);
        }}
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {justSet ? <FormNotice message={t('passwordSet')} /> : null}
      <ChangePasswordForm />
    </div>
  );
}
