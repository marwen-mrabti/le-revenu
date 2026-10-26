import { connection } from 'next/server';

import type { AppLocale } from '@/i18n/routing';

import { getCategories } from '../data';
import { CategoryNav } from './category-nav';

/**
 * Fetches the spaces at request time, inside the layout's Suspense boundary.
 * `connection()` keeps the (cached, tagged) read out of the build: a clean
 * build needs no running Strapi.
 */
export async function CategoryNavLoader({ locale }: { locale: AppLocale }) {
  await connection();
  const categories = await getCategories(locale);
  return <CategoryNav categories={categories} />;
}
