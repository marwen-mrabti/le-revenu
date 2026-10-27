import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { readerName, UserAvatar } from '@/components/shared/user-avatar';
import { AccountProfileForm } from '@/features/auth/components/account-profile-form';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';
import { DeleteAccountPanel } from '@/features/auth/components/delete-account-panel';
import { getCurrentUser } from '@/features/auth/data';
import { Link, redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

import AccountLoading from './loading';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('accountTitle'), robots: { index: false } };
}

function Section({
  title,
  children,
  danger = false,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      aria-label={title}
      className={`mt-5 rounded-xl border bg-card p-5 shadow-xs sm:p-6 ${danger ? 'border-destructive/40' : 'border-border'}`}
    >
      <h2 className={`text-[15px] font-bold ${danger ? 'text-destructive' : ''}`}>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Reads the session: a visitor is sent to the login page and comes back here. */
async function AccountContent() {
  const [t, locale, user] = await Promise.all([
    getTranslations('Account'),
    getLocale(),
    getCurrentUser(),
  ]);
  const appLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  if (!user) {
    redirect({ href: { pathname: '/login', query: { next: '/account' } }, locale: appLocale });
    return null;
  }

  const name = readerName(user);
  const viaGoogle = user.provider === 'google';

  return (
    <main id="content" className="mx-auto w-full max-w-[720px] px-4 py-8">
      <h1 className="font-heading text-[26px] leading-tight font-bold tracking-tight">
        {t('title')}
      </h1>
      <div className="mt-4 flex items-center gap-3.5">
        <UserAvatar avatarUrl={user.avatarUrl} name={name} className="size-14 text-xl" />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-[17px] font-bold">
            {name}
            {viaGoogle ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {t('viaGoogle')}
              </span>
            ) : null}
          </p>
          <p className="truncate text-[13.5px] text-muted-foreground">
            @{user.username} · {user.email}
          </p>
        </div>
      </div>

      <Section title={t('profile')}>
        <AccountProfileForm user={user} />
      </Section>

      <Section title={t('password')}>
        {viaGoogle ? (
          <p className="text-sm text-secondary-foreground">
            {t.rich('googleNoPassword', {
              link: (chunks) => (
                <Link href="/forgot-password" className="font-semibold text-brand-text">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        ) : (
          <ChangePasswordForm />
        )}
      </Section>

      <Section title={t('dangerZone')} danger>
        <DeleteAccountPanel username={user.username} />
      </Section>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountContent />
    </Suspense>
  );
}
