import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';

import { getCategories } from '@/features/categories/data';
import type { AppLocale } from '@/i18n/routing';
import { strapiGet } from '@/lib/strapi/public';
import { collectionTag, entryTag } from '@/lib/cache/tags';
import { StrapiError } from '@/lib/strapi/base';
import { strapiList, strapiOne } from '@/lib/strapi/schemas';

import {
  discussionDetailSchema,
  discussionListItemSchema,
  type DiscussionDetail,
  type DiscussionFilters,
  type DiscussionPage,
} from './schemas';

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

/**
 * One discussion by slug with its replies, cached for hours and tagged with
 * the collection and the entry (ADR-0003, ADR-0006): the reply handlers and
 * the Strapi webhook invalidate it. `null` for an unknown slug, so the page
 * can answer 404 without caching an error. `locale` only localises the category.
 */
export async function getDiscussion(
  slug: string,
  locale: AppLocale,
): Promise<DiscussionDetail | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(collectionTag('discussions'));

  let detail: DiscussionDetail;
  try {
    ({ data: detail } = await strapiGet(`/discussions/slug/${encodeURIComponent(slug)}`, {
      schema: strapiOne(discussionDetailSchema),
      tags: [collectionTag('discussions')],
    }));
  } catch (error) {
    if (error instanceof StrapiError && error.status === 404) return null;
    throw error;
  }
  cacheTag(entryTag('discussions', detail.documentId));

  if (!detail.category) return detail;
  const localized = (await getCategories(locale)).find(
    (category) => category.documentId === detail.category?.documentId,
  );
  return localized ? { ...detail, category: { ...detail.category, name: localized.name } } : detail;
}
