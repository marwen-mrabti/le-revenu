import { hasLocale } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { CategoryNavLoader } from '@/features/categories/components/category-nav-loader';
import { CategoryNavSkeleton } from '@/features/categories/components/category-nav-skeleton';
import { routing } from '@/i18n/routing';

/**
 * Forum shell: left column = spaces (≥ 768 px), middle and right columns come
 * from the page (it knows the active filters). 3 columns ≥ 1180, 2 ≥ 768, 1 below.
 */
export default async function ForumLayout({ children }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale();
  const appLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;

  return (
    <div className="mx-auto grid w-full max-w-[1260px] grid-cols-1 items-start gap-4 px-4 py-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-7 md:py-6 xl:grid-cols-[212px_minmax(0,1fr)_304px]">
      <div className="sticky top-[86px] hidden md:block">
        <Suspense fallback={<CategoryNavSkeleton />}>
          <CategoryNavLoader locale={appLocale} />
        </Suspense>
      </div>
      {children}
    </div>
  );
}
