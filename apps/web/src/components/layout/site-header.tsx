import { getTranslations } from 'next-intl/server';

import { LocaleMenu } from '@/components/layout/locale-menu';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Link } from '@/i18n/navigation';

/** Header shell. Search, publish and account controls arrive with their features. */
export async function SiteHeader() {
  const t = await getTranslations('Common');
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:m-2">
        {t('skipToContent')}
      </a>
      <div className="mx-auto flex h-14 w-full max-w-[1260px] items-center justify-between px-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="inline-flex items-stretch bg-primary p-0.5 text-sm leading-none font-black tracking-tight text-white">
            <span className="mr-0.5 bg-foreground px-1 py-0.5 dark:bg-black">LE</span>
            <span className="px-1 py-0.5">REVENU</span>
          </span>
          <span className="border-l border-border pl-2 text-xs text-muted-foreground">
            {t('community')}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleMenu />
        </div>
      </div>
    </header>
  );
}
