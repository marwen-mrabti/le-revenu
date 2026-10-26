'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';

import { ErrorHero } from '@/components/layout/error-hero';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

/** 500 for any page of the locale: header kept, retry, an incident code to quote. */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Errors');
  const format = useFormatter();
  const at = useMemo(() => new Date(), []);
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="content" className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 py-10">
      <ErrorHero
        role="alert"
        kicker={t('serverKicker')}
        code="500"
        title={t('serverTitle')}
        description={t('serverDescription')}
      >
        <Button size="lg" className="h-10" onClick={reset}>
          {t('retry')}
        </Button>
        <Link
          href="/discussions"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'lg' }),
            'h-10 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white',
          )}
        >
          {t('viewDiscussions')}
        </Link>
      </ErrorHero>
      <p className="flex flex-wrap justify-between gap-2 rounded-xl border border-border bg-card px-5 py-3 text-[12.5px] text-muted-foreground">
        <span>
          {t('incident')}{' '}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
            {error.digest ?? 'n/a'}
          </code>
        </span>
        <time dateTime={at.toISOString()}>{format.dateTime(at, 'long')}</time>
      </p>
    </main>
  );
}
