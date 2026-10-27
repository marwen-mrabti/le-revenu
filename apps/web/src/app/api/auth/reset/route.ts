import type { NextRequest } from 'next/server';

import { localePrefix, requestLocale } from '@/lib/i18n/request-locale';

/**
 * Landing of the reset mail: Strapi appends `?code=…` to one URL and knows no locale.
 * The code travels on to the reset page in the reader's language; a missing or
 * malformed code goes to the forgot page instead.
 */
export function GET(request: NextRequest): Response {
  const prefix = localePrefix(requestLocale(request));
  const code = request.nextUrl.searchParams.get('code') ?? '';
  const target = new URL(
    code.length >= 20 && code.length <= 512
      ? `${prefix}/reset-password`
      : `${prefix}/forgot-password`,
    request.url,
  );
  if (target.pathname.endsWith('/reset-password')) target.searchParams.set('code', code);
  return Response.redirect(target, 302);
}
