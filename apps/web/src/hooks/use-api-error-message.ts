'use client';

import { useTranslations } from 'next-intl';

import { ApiError } from '@/lib/api/client';

export type ErrorCode =
  | 'unavailable'
  | 'upstream'
  | 'rateLimited'
  | 'notFound'
  | 'invalid'
  | 'forbidden'
  | 'unauthenticated'
  | 'generic';

/** Stable BFF codes (and HTTP statuses) → one of our message keys. Raw server text never reaches the screen. */
export function errorCodeOf(error: unknown): ErrorCode {
  if (typeof error === 'string') return error as ErrorCode;
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'UNAVAILABLE':
        return 'unavailable';
      case 'INVALID_RESPONSE':
      case 'HTTP_ERROR':
        return 'upstream';
      case 'RATE_LIMITED':
        return 'rateLimited';
      case 'VALIDATION':
        return 'invalid';
      case 'CROSS_ORIGIN':
        return 'forbidden';
      default:
        break;
    }
    if (error.status === 404) return 'notFound';
    if (error.status === 401) return 'unauthenticated';
    if (error.status === 403) return 'forbidden';
    if (error.status === 503) return 'unavailable';
    if (error.status === 502) return 'upstream';
  }
  if (error instanceof TypeError) return 'unavailable'; // fetch failed: offline or server down
  return 'generic';
}

/** Translated, user-facing sentence for any error a query or mutation can throw. */
export function useApiErrorMessage() {
  const t = useTranslations('Errors');
  return (error: unknown): string => t(`codes.${errorCodeOf(error)}`);
}
