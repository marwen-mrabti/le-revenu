import type { NextRequest } from 'next/server';

import { appUrl } from '@/lib/app-url';
import { localePrefix, requestLocale } from '@/lib/i18n/request-locale';

/**
 * Landing of the confirmation mail. Strapi knows one redirection URL and no locale,
 * so it sends the browser here; the login page then shows the "address confirmed"
 * banner in the reader's language.
 */
export function GET(request: NextRequest): Response {
  const prefix = localePrefix(requestLocale(request));
  return Response.redirect(appUrl(`${prefix}/login?confirmed=1`), 302);
}
