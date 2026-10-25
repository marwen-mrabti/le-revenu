import type { Core } from '@strapi/strapi';

/** Locales the site serves. The first one is the default. */
export const LOCALES = [
  { code: 'fr', name: 'French (fr)' },
  { code: 'en', name: 'English (en)' },
] as const;

export type LocaleCode = (typeof LOCALES)[number]['code'];

interface LocaleRecord {
  id: number;
  code: string;
  name: string;
  isDefault: boolean;
}

interface LocalesService {
  findByCode(code: string): Promise<LocaleRecord | undefined>;
  create(
    locale: { code: string; name: string },
    options?: { isDefault?: boolean },
  ): Promise<LocaleRecord>;
  getDefaultLocale(): Promise<string>;
  setDefaultLocale(locale: { code: string }): Promise<void>;
}

/**
 * Makes sure every locale in LOCALES exists and the first one is the default.
 * Idempotent: safe on every boot.
 */
export async function ensureLocales(strapi: Core.Strapi): Promise<void> {
  const service = strapi.plugin('i18n').service('locales') as LocalesService;
  const [defaultLocale] = LOCALES;

  for (const locale of LOCALES) {
    const existing = await service.findByCode(locale.code);
    if (!existing) {
      await service.create({ code: locale.code, name: locale.name });
      strapi.log.info(`i18n: created locale ${locale.code}`);
    }
  }

  const current = await service.getDefaultLocale();
  if (current !== defaultLocale.code) {
    await service.setDefaultLocale({ code: defaultLocale.code });
    strapi.log.info(`i18n: default locale set to ${defaultLocale.code}`);
  }
}
