import { connection } from 'next/server';

import { IslandError } from '@/components/shared/island-error';
import { errorCodeOfStrapi } from '@/lib/api/error-codes';
import type { AppLocale } from '@/i18n/routing';

import { getCategories } from '../data';
import { CategoryNav } from './category-nav';

/**
 * Fetches the spaces at request time, inside the layout's Suspense boundary.
 * `connection()` keeps the (cached, tagged) read out of the build: a clean
 * build needs no running Strapi. A failure stays in this column.
 */
export async function CategoryNavLoader({ locale }: { locale: AppLocale }) {
  await connection();
  const result = await getCategories(locale).then(
    (categories) => ({ categories, error: null }),
    (error: unknown) => ({ categories: null, error }),
  );
  if (!result.categories) {
    return (
      <IslandError error={errorCodeOfStrapi(result.error)} variant="quiet" className="px-2.5" />
    );
  }
  return <CategoryNav categories={result.categories} />;
}
