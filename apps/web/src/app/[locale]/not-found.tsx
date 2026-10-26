import { SearchIcon } from 'lucide-react';
import { connection } from 'next/server';
import { hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { ErrorHero } from '@/components/layout/error-hero';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getCategories } from '@/features/categories/data';
import { Link } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

/** 404 inside the locale layout: header kept, a way back, a search box and the spaces. */
export default async function NotFoundPage() {
  const [t, locale] = await Promise.all([getTranslations('Errors'), getLocale()]);
  const appLocale: AppLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;

  return (
    <main id="content" className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 py-10">
      <ErrorHero
        kicker={t('notFoundKicker')}
        code="404"
        title={t('notFoundTitle')}
        description={t('notFoundDescription')}
      >
        <Link href="/discussions" className={cn(buttonVariants({ size: 'lg' }), 'h-10')}>
          {t('viewDiscussions')}
        </Link>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'lg' }),
            'h-10 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white',
          )}
        >
          {t('backHome')}
        </Link>
      </ErrorHero>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {t('searchTitle')}
        </h2>
        <form
          action={`${appLocale === routing.defaultLocale ? '' : `/${appLocale}`}/discussions`}
          method="get"
          className="relative"
        >
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <label htmlFor="not-found-search" className="sr-only">
            {t('searchTitle')}
          </label>
          <Input
            id="not-found-search"
            name="q"
            type="search"
            placeholder={t('searchPlaceholder')}
            className="h-10 pl-9"
          />
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {t('exploreTitle')}
        </h2>
        <Suspense fallback={<Skeleton className="h-8 w-full" />}>
          <SpaceLinks locale={appLocale} allLabel={t('allSpaces')} />
        </Suspense>
      </section>
    </main>
  );
}

async function SpaceLinks({ locale, allLabel }: { locale: AppLocale; allLabel: string }) {
  await connection();
  const categories = await getCategories(locale).catch(() => []);
  const chip =
    'inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-[13.5px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground';
  return (
    <ul className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <li key={category.documentId}>
          <Link href={`/discussions?category=${category.slug}`} className={chip}>
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-muted-foreground"
              style={category.color ? { backgroundColor: category.color } : undefined}
            />
            {category.name}
          </Link>
        </li>
      ))}
      <li>
        <Link href="/discussions" className={chip}>
          {allLabel}
        </Link>
      </li>
    </ul>
  );
}
