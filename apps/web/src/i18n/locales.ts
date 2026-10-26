import type { AppLocale } from './routing';

/** Display metadata per locale. Adding a language: one entry here + its messages file + the Strapi locale. */
export const LOCALE_META: Record<AppLocale, { flag: string; name: string }> = {
  fr: { flag: '🇫🇷', name: 'Français' },
  en: { flag: '🇬🇧', name: 'English' },
};
