import type { Metadata } from 'next';
import { getFormatter, getTranslations } from 'next-intl/server';

import { RelativeTime } from '@/components/shared/relative-time';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('discussionsTitle'), description: t('discussionsDescription') };
}

/**
 * Placeholder proving the locale machinery end to end: a translated title,
 * a formatted date, a relative time and a plural. Replaced by the real list
 * in the discussions branch.
 */
export default async function DiscussionsPage() {
  const t = await getTranslations('Discussions');
  const format = await getFormatter();
  const sample = new Date('2026-10-25T09:30:00Z');

  return (
    <main id="content" className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="font-heading text-3xl font-bold">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('intro')}</p>
      <ul className="mt-8 space-y-1 text-sm">
        <li>{t('publishedOn', { date: format.dateTime(sample, 'short') })}</li>
        <li>
          <RelativeTime date={sample} />
        </li>
        <li>{t('replyCount', { count: 0 })}</li>
        <li>{t('replyCount', { count: 1 })}</li>
        <li>{t('replyCount', { count: 12 })}</li>
      </ul>
    </main>
  );
}
