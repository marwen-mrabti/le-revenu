import { hasLocale } from 'next-intl';
import type { NextRequest } from 'next/server';

import { routing, type AppLocale } from '@/i18n/routing';

/** First supported language of an `Accept-Language` header (`en-GB,en;q=0.9,fr;q=0.8` → `en`). */
function fromAcceptLanguage(header: string | null): AppLocale | null {
  for (const part of (header ?? '').split(',')) {
    const tag = part.trim().split(';')[0]?.toLowerCase().split('-')[0];
    if (hasLocale(routing.locales, tag)) return tag;
  }
  return null;
}

/**
 * Locale of a request that arrives outside the localized pages (a link from a mail):
 * next-intl's cookie first (set when the reader chose a language other than the
 * browser's), else the browser's languages, else the default.
 */
export function requestLocale(request: NextRequest): AppLocale {
  const cookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (hasLocale(routing.locales, cookie)) return cookie;
  return fromAcceptLanguage(request.headers.get('accept-language')) ?? routing.defaultLocale;
}

/** URL prefix of a locale: empty for the default one, `/en` otherwise. */
export function localePrefix(locale: AppLocale): string {
  return locale === routing.defaultLocale ? '' : `/${locale}`;
}
