import { getTranslations } from 'next-intl/server';

import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { Link } from '@/i18n/navigation';

/** Header shell. Search, publish and account controls arrive with their features. */
export async function SiteHeader() {
  const t = await getTranslations('Common');
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:m-2">
        {t('skipToContent')}
      </a>
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-heading text-base font-black tracking-wide">
            <span className="text-primary">LE</span> REVENU
          </span>
          <span className="border-l border-border pl-2 text-xs text-muted-foreground">
            {t('community')}
          </span>
        </Link>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
