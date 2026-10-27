'use client';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Suspense, type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { IslandError } from './island-error';

interface IslandProps {
  /** Skeleton shown while the data streams. Same size as the content: no layout shift. */
  fallback: ReactNode;
  /** `card` (default) or `quiet` error rendering. */
  variant?: 'card' | 'quiet';
  className?: string;
  children: ReactNode;
}

/**
 * One self-contained section of a page: it loads on its own and fails on its
 * own. A thrown error (a `useSuspenseQuery` rejection, a server component
 * failure streamed in) stays inside; Réessayer resets the boundary and the
 * queries beneath it. Server Components can be passed as children.
 */
export function Island({ fallback, variant, className, children }: IslandProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <IslandError
              error={error}
              onRetry={resetErrorBoundary}
              variant={variant}
              className={className}
            />
          )}
        >
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
