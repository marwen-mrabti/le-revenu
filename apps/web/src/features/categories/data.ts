import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';

import type { AppLocale } from '@/i18n/routing';
import { strapiGet } from '@/lib/strapi/public';
import { strapiList } from '@/lib/strapi/schemas';

import { categorySchema, type Category } from './schemas';

export const CATEGORIES_TAG = 'strapi:categories';

/**
 * The eleven spaces, in the page language. Cached for hours and tagged:
 * the Strapi webhook invalidates the tag when an editor changes a category.
 * `locale` is an argument on purpose: nothing request-bound is read inside the cache scope.
 */
export async function getCategories(locale: AppLocale): Promise<Category[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(CATEGORIES_TAG);

  const { data } = await strapiGet('/categories', {
    query: { locale, sort: 'name:asc', pagination: { pageSize: 50 } },
    schema: strapiList(categorySchema),
    tags: [CATEGORIES_TAG],
  });
  return data;
}

/** One category by slug from the cached list; `undefined` for an unknown slug. */
export async function findCategory(locale: AppLocale, slug: string): Promise<Category | undefined> {
  const categories = await getCategories(locale);
  return categories.find((category) => category.slug === slug);
}
