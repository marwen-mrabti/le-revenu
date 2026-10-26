import { hasLocale } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { CategoryNav } from '@/features/categories/components/category-nav';
import { CategoryNavSkeleton } from '@/features/categories/components/category-nav-skeleton';
import { getCategories } from '@/features/categories/data';
import { routing } from '@/i18n/routing';

/**
 * Forum shell: left column = spaces (≥ 768 px), middle and right columns come
 * from the page (it knows the active filters). 3 columns ≥ 1180, 2 ≥ 768, 1 below.
 */
export default async function ForumLayout({ children }: LayoutProps<'/[locale]'>) {
  const locale = await getLocale();
  const categories = hasLocale(routing.locales, locale) ? await getCategories(locale) : [];

  return (
    <div className="mx-auto grid w-full max-w-[1260px] grid-cols-1 items-start gap-4 px-4 py-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-7 md:py-6 xl:grid-cols-[212px_minmax(0,1fr)_304px]">
      <div className="sticky top-[86px] hidden md:block">
        <Suspense fallback={<CategoryNavSkeleton />}>
          <CategoryNav categories={categories} />
        </Suspense>
      </div>
      {children}
    </div>
  );
}
