'use client';

import { ChevronDownIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/components/theme/theme-provider';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LOCALE_META } from '@/i18n/locales';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';

const THEMES = ['light', 'dark', 'system'] as const;

/**
 * Language menu (flag, native name, code) with the theme choice underneath.
 * Switching the locale keeps the current path and search params.
 */
export function LocaleMenu() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('Nav');
  const tTheme = useTranslations('Theme');
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const current = LOCALE_META[locale];

  function switchTo(next: string) {
    if (next === locale) return;
    // Read at click time: reading search params during render would require a Suspense boundary.
    router.replace(`${pathname}${window.location.search}`, { locale: next as AppLocale });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" aria-label={t('language')} />}
      >
        <span aria-hidden="true">{current.flag}</span>
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDownIcon aria-hidden="true" className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuRadioGroup value={locale} onValueChange={switchTo}>
          <DropdownMenuLabel>{t('language')}</DropdownMenuLabel>
          {routing.locales.map((code) => (
            <DropdownMenuRadioItem key={code} value={code} lang={code}>
              <span aria-hidden="true">{LOCALE_META[code].flag}</span>
              {LOCALE_META[code].name}
              <span className="ml-auto text-xs text-muted-foreground uppercase" aria-hidden="true">
                {code}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme ?? 'system'} onValueChange={setTheme}>
          <DropdownMenuLabel>{tTheme('label')}</DropdownMenuLabel>
          {THEMES.map((value) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {tTheme(value)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
