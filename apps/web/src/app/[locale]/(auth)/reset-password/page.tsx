import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { AuthCard } from '@/features/auth/components/auth-card';
import { ResetForm } from '@/features/auth/components/reset-form';
import { Link } from '@/i18n/navigation';

import AuthLoading from '../loading';

type Props = PageProps<'/[locale]/reset-password'>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('resetTitle'), robots: { index: false } };
}

/** Reads the mailed `code`, so it streams inside the page's Suspense boundary. */
async function ResetContent({ searchParams }: Pick<Props, 'searchParams'>) {
  const [t, params] = await Promise.all([getTranslations('Auth'), searchParams]);
  const raw = Array.isArray(params.code) ? params.code[0] : params.code;
  const code = raw && raw.length >= 20 && raw.length <= 512 ? raw : null;

  return (
    <AuthCard
      title={code ? t('resetTitle') : t('resetInvalidTitle')}
      intro={code ? t('resetIntro') : t('resetInvalidIntro')}
      footer={
        <Link href="/login" className="font-semibold text-brand-text">
          {t('backToLogin')}
        </Link>
      }
    >
      <ResetForm code={code} />
    </AuthCard>
  );
}

export default function ResetPasswordPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AuthLoading />}>
      <ResetContent searchParams={searchParams} />
    </Suspense>
  );
}
