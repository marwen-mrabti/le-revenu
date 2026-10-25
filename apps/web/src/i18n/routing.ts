import { defineRouting } from 'next-intl/routing';

/**
 * Supported locales. The first one is the default and keeps clean URLs
 * (`/discussions`); the others are prefixed (`/en/discussions`).
 * Adding a locale: add it here, add `messages/<code>.json`, add it in Strapi.
 */
export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed',
  // Deterministic URLs: `/` is always French. Readers choose English with the switcher.
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
