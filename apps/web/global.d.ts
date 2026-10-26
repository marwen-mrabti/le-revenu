import type { formats } from './src/i18n/request';
import type { routing } from './src/i18n/routing';
import type messages from './messages/fr.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
    Formats: typeof formats;
  }
}
