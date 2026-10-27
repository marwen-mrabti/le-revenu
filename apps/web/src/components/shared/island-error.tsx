'use client';

import { AlertTriangleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { useApiErrorMessage, type ErrorCode } from '@/hooks/use-api-error-message';
import { cn } from '@/lib/utils';

interface IslandErrorProps {
  /** The thrown error, or one of our codes when the server already classified it. */
  error: unknown | ErrorCode;
  /** Retries the island: resets the boundary (client data) or refreshes the route (server data). */
  onRetry?: () => void;
  /** `card` for content areas, `quiet` for secondary blocks (one line, no box). */
  variant?: 'card' | 'quiet';
  className?: string;
}

/** The contained failure of one section: a sentence, a retry, nothing else breaks. */
export function IslandError({ error, onRetry, variant = 'card', className }: IslandErrorProps) {
  const t = useTranslations('Errors');
  const message = useApiErrorMessage()(error);
  const router = useRouter();
  const retry = onRetry ?? (() => router.refresh());

  if (variant === 'quiet') {
    return (
      <p
        role="alert"
        className={cn('flex flex-wrap items-center gap-2 text-sm text-muted-foreground', className)}
      >
        <AlertTriangleIcon aria-hidden="true" className="size-4 shrink-0 text-destructive" />
        <span>{message}</span>
        <Button variant="link" size="sm" className="h-auto p-0" onClick={retry}>
          {t('retry')}
        </Button>
      </p>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-5 py-8 text-center',
        className,
      )}
    >
      <span className="inline-grid size-10 place-items-center rounded-lg bg-destructive/10 text-destructive">
        <AlertTriangleIcon aria-hidden="true" className="size-5" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="secondary" size="sm" onClick={retry}>
        {t('retry')}
      </Button>
    </div>
  );
}
