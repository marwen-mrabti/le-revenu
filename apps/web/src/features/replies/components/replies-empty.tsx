import { useTranslations } from 'next-intl';

/** Zero replies: an invitation rather than a blank. */
export function RepliesEmpty({ authorName }: { authorName: string }) {
  const t = useTranslations('Replies');
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-5 py-6">
      <h2 className="text-[17px] font-bold">{t('emptyTitle')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('emptyHint', { name: authorName })}</p>
    </div>
  );
}
