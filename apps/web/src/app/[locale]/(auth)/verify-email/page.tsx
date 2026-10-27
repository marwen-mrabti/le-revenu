import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { z } from 'zod';

import { AuthCard } from '@/features/auth/components/auth-card';
import { VerifyEmail } from '@/features/auth/components/verify-email';
import { nextPathSchema } from '@/features/auth/schemas';
import { Link, redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { hasLocale } from 'next-intl';
import { getLocale } from 'next-intl/server';

import AuthLoading from '../loading';

type Props = PageProps<'/[locale]/verify-email'>;

const emailParam = z.email().max(254);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('verifyTitle'), robots: { index: false } };
}

/** Reads the `email` to show and resend to; without one there is nothing to do here. */
async function VerifyContent({ searchParams }: Pick<Props, 'searchParams'>) {
  const [t, locale, params] = await Promise.all([
    getTranslations('Auth'),
    getLocale(),
    searchParams,
  ]);
  const appLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const email = emailParam.safeParse(Array.isArray(params.email) ? params.email[0] : params.email);
  if (!email.success) {
    redirect({ href: '/register', locale: appLocale });
    return null;
  }
  const next = nextPathSchema.parse(Array.isArray(params.next) ? params.next[0] : params.next);

  return (
    <AuthCard
      title={t('verifyTitle')}
      intro={t('verifyIntroShort')}
      footer={
        <Link
          href={{ pathname: '/login', query: { next } }}
          className="font-semibold text-brand-text"
        >
          {t('backToLogin')}
        </Link>
      }
    >
      <VerifyEmail email={email.data} />
    </AuthCard>
  );
}

export default function VerifyEmailPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AuthLoading />}>
      <VerifyContent searchParams={searchParams} />
    </Suspense>
  );
}
