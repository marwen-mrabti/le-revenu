'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { env } from '@/config/env';
import { Link, useRouter } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

import { useGoogleSession } from '../api/mutations';
import { nextPathSchema } from '../schemas';

type Status = 'pending' | 'taken' | 'failed';

/**
 * Google sent the browser back here. Strapi holds the provider answer in its
 * own session, so the browser asks Strapi for the JWT (one request, kept in
 * memory), then hands it to the BFF which sets the session cookie.
 */
export function GoogleCallback() {
  const t = useTranslations('Auth');
  const currentLocale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const exchange = useGoogleSession();
  // Strapi redirects here with `?error=` when the provider refused; nothing to exchange then.
  const providerError = params.get('error');
  const [status, setStatus] = useState<Status>(() => (providerError ? 'failed' : 'pending'));
  const started = useRef(false);

  const next = nextPathSchema.parse(params.get('next') ?? undefined);
  const wanted = params.get('locale');
  const locale: AppLocale = (routing.locales as readonly string[]).includes(wanted ?? '')
    ? (wanted as AppLocale)
    : (currentLocale as AppLocale);

  useEffect(() => {
    if (started.current || providerError) return;
    started.current = true;
    (async () => {
      try {
        const response = await fetch(`${env.NEXT_PUBLIC_STRAPI_URL}/api/auth/google/callback`, {
          credentials: 'include',
          headers: { accept: 'application/json' },
        });
        const body = (await response.json()) as { jwt?: string; error?: { message?: string } };
        if (!response.ok || !body.jwt) {
          setStatus(/already taken/i.test(body.error?.message ?? '') ? 'taken' : 'failed');
          return;
        }
        const { user } = await exchange.mutateAsync(body.jwt);
        toast.success(t('welcome', { name: user.username }));
        router.replace(next as '/discussions', { locale });
      } catch {
        setStatus('failed');
      }
    })();
  }, [exchange, locale, next, providerError, router, t]);

  return (
    <main id="content" className="mx-auto w-full max-w-[420px] px-4 py-16 text-center">
      {status === 'pending' ? (
        <div role="status" className="flex flex-col items-center gap-4 text-muted-foreground">
          <Spinner className="size-7 text-brand-text" aria-hidden="true" />
          <p>{t('googlePending')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <FormAlert message={status === 'taken' ? t('googleTaken') : t('googleFailed')} />
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-10')}
          >
            {t('backToLogin')}
          </Link>
        </div>
      )}
    </main>
  );
}
