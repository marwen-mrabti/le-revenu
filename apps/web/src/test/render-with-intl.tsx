import { render, type RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';

import en from '../../messages/en.json';
import fr from '../../messages/fr.json';
import type { AppLocale } from '@/i18n/routing';

/** Both catalogs share the French key set (asserted by messages.test.ts); cast to the typed source. */
const MESSAGES = { fr, en: en as unknown as typeof fr } as const;

/** Renders a client component inside the i18n provider for the given locale. */
export function renderWithIntl(
  ui: ReactElement,
  { locale = 'fr', ...options }: RenderOptions & { locale?: AppLocale } = {},
) {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone="Europe/Paris"
      now={new Date('2026-10-25T12:00:00Z')}
    >
      {ui}
    </NextIntlClientProvider>,
    options,
  );
}
