import { StrapiError } from '@/lib/strapi/base';

import type { ErrorCode } from '@/hooks/use-api-error-message';

/** Server side: a StrapiError (from the DAL) → the message key a client fallback can translate. */
export function errorCodeOfStrapi(error: unknown): ErrorCode {
  if (error instanceof StrapiError) {
    if (error.status === 503) return 'unavailable';
    if (error.status === 502) return 'upstream';
    if (error.status === 429) return 'rateLimited';
    if (error.status === 404) return 'notFound';
    if (error.status === 400) return 'invalid';
    if (error.status === 403) return 'forbidden';
    if (error.status === 401) return 'unauthenticated';
  }
  return 'generic';
}
