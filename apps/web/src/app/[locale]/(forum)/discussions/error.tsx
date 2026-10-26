'use client';

import { AlertTriangleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

/** Shown when the list cannot be loaded (Strapi down, bad answer). The shell around it stays. */
export default function DiscussionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Errors');
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="content" className="flex min-w-0 flex-col gap-4">
      <Empty className="rounded-xl border border-border bg-card py-12" role="alert">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
            <AlertTriangleIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle className="font-heading text-xl">{t('title')}</EmptyTitle>
          <EmptyDescription>{t('description')}</EmptyDescription>
        </EmptyHeader>
        <Button onClick={reset}>{t('retry')}</Button>
      </Empty>
    </main>
  );
}
