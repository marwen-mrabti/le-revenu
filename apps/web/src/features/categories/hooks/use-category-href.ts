'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Builds the list URL for a category while keeping sort and search, and
 * resetting the page. `null` means "all spaces". Reads the current search
 * params, so the caller must sit under a Suspense boundary.
 */
export function useCategoryHref() {
  const searchParams = useSearchParams();
  const active = searchParams.get('category');

  const hrefFor = (slug: string | null): `/discussions?${string}` | '/discussions' => {
    const params = new URLSearchParams(searchParams);
    if (slug) params.set('category', slug);
    else params.delete('category');
    params.delete('page');
    const query = params.toString();
    return query ? `/discussions?${query}` : '/discussions';
  };

  return { active, hrefFor };
}
