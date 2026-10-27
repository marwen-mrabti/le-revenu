import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AuthCard } from '@/features/auth/components/auth-card';
import { ForgotForm } from '@/features/auth/components/forgot-form';
import { Link } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('forgotTitle'), robots: { index: false } };
}

/** Static: no session read, the form talks to the BFF on its own. */
export default async function ForgotPasswordPage() {
  const t = await getTranslations('Auth');
  return (
    <AuthCard
      title={t('forgotTitle')}
      intro={t('forgotIntro')}
      footer={
        <Link href="/login" className="font-semibold text-brand-text">
          {t('backToLogin')}
        </Link>
      }
    >
      <ForgotForm />
    </AuthCard>
  );
}
