import { locale as rootLocale } from 'next/root-params';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { routing } from './routing';

export const formats = {
  dateTime: {
    short: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  },
} as const;

/**
 * Per-request i18n configuration. The locale comes from the `[locale]` root
 * param (Next 16.3+), which keeps pages cacheable and prerenderable; an explicit
 * `locale` argument (e.g. from `getTranslations({ locale })` in Route Handlers)
 * takes precedence.
 */
export default getRequestConfig(async ({ locale }) => {
  const candidate = locale ?? (await rootLocale());
  if (!hasLocale(routing.locales, candidate)) notFound();

  return {
    locale: candidate,
    messages: (await import(`../../messages/${candidate}.json`)).default,
    timeZone: 'Europe/Paris',
    formats,
  };
});
