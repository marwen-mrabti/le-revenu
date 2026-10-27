import { getTranslations } from 'next-intl/server';

import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

/** A visitor's reply box: log in and come back here. */
export async function ReplyCallToAction({
  authorName,
  currentPath,
}: {
  authorName: string;
  currentPath: string;
}) {
  const t = await getTranslations('Replies');
  return (
    <section
      aria-labelledby="reply-cta-title"
      className="rounded-xl border border-border bg-card px-5 py-5 shadow-xs"
    >
      <h2 id="reply-cta-title" className="font-heading text-[19px] font-bold">
        {t('ctaTitle')}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('ctaText', { name: authorName })}</p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Link
          href={{ pathname: '/login', query: { next: currentPath } }}
          className={cn(buttonVariants({ size: 'lg' }), 'h-10')}
        >
          {t('ctaLogin')}
        </Link>
        <Link
          href={{ pathname: '/register', query: { next: currentPath } }}
          className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'h-10')}
        >
          {t('ctaRegister')}
        </Link>
      </div>
    </section>
  );
}
