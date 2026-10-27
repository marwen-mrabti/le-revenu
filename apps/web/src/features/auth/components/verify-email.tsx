'use client';

import { MailCheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { FormNotice } from '@/components/form/form-notice';
import { Button } from '@/components/ui/button';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';
import { Link } from '@/i18n/navigation';

import { useSendConfirmation } from '../api/mutations';

const COOLDOWN_SECONDS = 60;

/** After sign-up: what to do next, and a resend button that rests a minute between mails. */
export function VerifyEmail({ email }: { email: string }) {
  const t = useTranslations('Auth');
  const errorMessage = useApiErrorMessage();
  const resend = useSendConfirmation();
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function onResend() {
    setError(null);
    resend.mutate(
      { email },
      {
        onSuccess: () => {
          setNotice(t('resent'));
          setCooldown(COOLDOWN_SECONDS);
        },
        onError: (failure) => setError(errorMessage(failure)),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="inline-grid size-11 place-items-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
        <MailCheckIcon aria-hidden="true" className="size-5" />
      </span>
      <p className="text-sm text-muted-foreground">
        {t.rich('verifyIntro', {
          email,
          b: (chunks) => <b className="text-foreground">{chunks}</b>,
        })}
      </p>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-secondary-foreground">
        <li>{t('verifyStep1')}</li>
        <li>{t('verifyStep2')}</li>
        <li>{t('verifyStep3')}</li>
      </ol>
      <FormNotice message={notice} />
      <FormAlert message={error} />
      <Button
        variant="secondary"
        size="lg"
        className="h-10"
        disabled={cooldown > 0 || resend.isPending}
        onClick={onResend}
      >
        {cooldown > 0 ? t('resendIn', { seconds: cooldown }) : t('resend')}
      </Button>
      <p className="text-center text-[13.5px] text-muted-foreground">
        {t.rich('wrongAddress', {
          link: (chunks) => (
            <Link href="/register" className="font-semibold text-brand-text">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
