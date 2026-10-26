import type { MetadataRoute } from 'next';

import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** Public routes. Discussions are appended from the data layer in the discussions branch. */
const STATIC_ROUTES = ['/discussions'] as const;

function entry(href: (typeof STATIC_ROUTES)[number]): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${BASE}${getPathname({ locale, href })}`]),
  );
  return {
    url: `${BASE}${getPathname({ locale: routing.defaultLocale, href })}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 1,
    alternates: { languages },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map(entry);
}
