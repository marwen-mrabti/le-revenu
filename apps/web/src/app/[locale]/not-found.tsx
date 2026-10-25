import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

export default async function NotFoundPage() {
  const t = await getTranslations('Errors');
  return (
    <main id="content" className="mx-auto w-full max-w-5xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold">{t('notFoundTitle')}</h1>
      <p className="mt-2 text-muted-foreground">{t('notFoundDescription')}</p>
      <Link href="/" className="mt-6 inline-block text-primary underline">
        {t('backHome')}
      </Link>
    </main>
  );
}
