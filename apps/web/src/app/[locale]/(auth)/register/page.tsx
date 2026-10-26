import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { AuthCard } from '@/features/auth/components/auth-card';
import { GoogleButton } from '@/features/auth/components/google-button';
import { RegisterForm } from '@/features/auth/components/register-form';
import { getCurrentUser } from '@/features/auth/data';
import { nextPathSchema } from '@/features/auth/schemas';
import { Link, redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

import AuthLoading from '../loading';

type Props = PageProps<'/[locale]/register'>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('registerTitle'), robots: { index: false } };
}

/** Reads `next` and the session, so it streams inside the page's Suspense boundary. */
async function RegisterContent({ searchParams }: Pick<Props, 'searchParams'>) {
  const [t, locale, params, user] = await Promise.all([
    getTranslations('Auth'),
    getLocale(),
    searchParams,
    getCurrentUser(),
  ]);
  const next = nextPathSchema.parse(Array.isArray(params.next) ? params.next[0] : params.next);
  const appLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  if (user) redirect({ href: next as '/discussions', locale: appLocale });

  return (
    <AuthCard
      title={t('registerTitle')}
      intro={t('registerIntro')}
      footer={t.rich('haveAccount', {
        link: (chunks) => (
          <Link
            href={{ pathname: '/login', query: { next } }}
            className="font-semibold text-brand-text"
          >
            {chunks}
          </Link>
        ),
      })}
    >
      <GoogleButton next={next} locale={appLocale} />
      <RegisterForm next={next} />
    </AuthCard>
  );
}

export default function RegisterPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AuthLoading />}>
      <RegisterContent searchParams={searchParams} />
    </Suspense>
  );
}
