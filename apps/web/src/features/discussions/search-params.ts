import { createLoader, parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs/server';

import { discussionFiltersSchema, SORTS, type DiscussionFilters } from './schemas';

/**
 * URL ↔ state contract of the list page. Shared by `page.tsx` (server, via the
 * loader) and the filter components (client, via `useQueryStates`).
 * Unknown values fall back to the default instead of failing the page.
 */
export const discussionSearchParams = {
  category: parseAsString,
  sort: parseAsStringLiteral(SORTS).withDefault('newest'),
  q: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
};

const load = createLoader(discussionSearchParams);

type RawFilters = {
  category: string | null;
  sort: (typeof SORTS)[number];
  q: string;
  page: number;
};

/** Same normalisation on the server (loader) and in the browser (`useQueryStates`), so query keys match. */
export function toFilters(raw: RawFilters): DiscussionFilters {
  return discussionFiltersSchema.parse({
    category: raw.category ?? undefined,
    sort: raw.sort,
    q: raw.q,
    page: Math.max(1, raw.page),
  });
}

/** Parses the page's `searchParams` promise into validated filters. */
export async function loadDiscussionFilters(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<DiscussionFilters> {
  return toFilters(await load(searchParams));
}

/** Query string for a BFF call or a link, defaults omitted so URLs stay clean. */
export function serializeFilters(
  filters: Partial<DiscussionFilters> & { locale?: string },
): string {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (filters.q) params.set('q', filters.q);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  if (filters.pageSize && filters.pageSize !== 10) params.set('pageSize', String(filters.pageSize));
  if (filters.locale) params.set('locale', filters.locale);
  return params.toString();
}
