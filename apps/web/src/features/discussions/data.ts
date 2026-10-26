import 'server-only';

import { getCategories } from '@/features/categories/data';
import type { AppLocale } from '@/i18n/routing';
import { strapiGet } from '@/lib/strapi/public';
import { strapiList } from '@/lib/strapi/schemas';

import { discussionListItemSchema, type DiscussionFilters, type DiscussionPage } from './schemas';

/** Strapi query for the list: filters, sort and pagination all happen in the backend. */
export function buildDiscussionsQuery(filters: DiscussionFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (filters.category) where.category = { slug: { $eq: filters.category } };
  if (filters.q) {
    where.$or = [{ title: { $containsi: filters.q } }, { content: { $containsi: filters.q } }];
  }
  return {
    filters: where,
    sort: filters.sort === 'oldest' ? 'createdAt:asc' : 'createdAt:desc',
    pagination: { page: filters.page, pageSize: filters.pageSize },
  };
}

/**
 * One page of discussions. Never cached: readers expect the list to be fresh.
 * The category of each item points at the French row in Strapi; it is swapped
 * for the page-language version from the cached categories list.
 */
export async function getDiscussions(
  filters: DiscussionFilters,
  locale: AppLocale,
): Promise<DiscussionPage> {
  const [{ data, meta }, categories] = await Promise.all([
    strapiGet('/discussions', {
      query: buildDiscussionsQuery(filters),
      schema: strapiList(discussionListItemSchema),
    }),
    getCategories(locale),
  ]);
  const byId = new Map(categories.map((category) => [category.documentId, category]));
  const items = data.map((item) => {
    if (!item.category) return item;
    const localized = byId.get(item.category.documentId);
    if (!localized) return item;
    return { ...item, category: { ...item.category, name: localized.name } };
  });
  return { items, pagination: meta.pagination };
}
