import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { AuthCard } from '@/features/auth/components/auth-card';
import { GoogleButton } from '@/features/auth/components/google-button';
import { LoginForm } from '@/features/auth/components/login-form';
import { getCurrentUser } from '@/features/auth/data';
import { nextPathSchema } from '@/features/auth/schemas';
import { Link, redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

import AuthLoading from '../loading';

type Props = PageProps<'/[locale]/login'>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('loginTitle'), robots: { index: false } };
}

/** Reads `next` and the session, so it streams inside the page's Suspense boundary. */
async function LoginContent({ searchParams }: Pick<Props, 'searchParams'>) {
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
      title={t('loginTitle')}
      intro={t('loginIntro')}
      footer={t.rich('noAccount', {
        link: (chunks) => (
          <Link
            href={{ pathname: '/register', query: { next } }}
            className="font-semibold text-brand-text"
          >
            {chunks}
          </Link>
        ),
      })}
    >
      <GoogleButton next={next} locale={appLocale} />
      <LoginForm next={next} />
      {process.env.NODE_ENV !== 'production' ? (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {t('demoAccounts', { a: 'alice', b: 'bob', password: 'Password123!' })}
        </p>
      ) : null}
    </AuthCard>
  );
}

export default function LoginPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AuthLoading />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
