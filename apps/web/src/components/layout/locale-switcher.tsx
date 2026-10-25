'use client';

import { useLocale, useTranslations } from 'next-intl';

import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

/** FR | EN toggle. Keeps the current path and search params, changes only the locale. */
export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations('Nav');
  const tLocale = useTranslations('Locale');
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: AppLocale) {
    if (next === locale) return;
    // Read at click time: reading search params during render would require a Suspense boundary.
    const query = window.location.search;
    router.replace(`${pathname}${query}`, { locale: next });
  }

  return (
    <div role="group" aria-label={t('language')} className="flex items-center gap-1 text-sm">
      {routing.locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 ? (
            <span aria-hidden="true" className="text-muted-foreground">
              |
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => switchTo(l)}
            aria-current={l === locale ? 'true' : undefined}
            aria-label={tLocale(l)}
            lang={l}
            className={cn(
              'rounded px-1.5 py-0.5 uppercase',
              l === locale
                ? 'font-semibold text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}
