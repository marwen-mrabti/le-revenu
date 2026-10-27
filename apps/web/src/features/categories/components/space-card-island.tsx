import { connection } from 'next/server';

import { IslandError } from '@/components/shared/island-error';
import { errorCodeOfStrapi } from '@/lib/api/error-codes';
import type { AppLocale } from '@/i18n/routing';

import { findCategory } from '../data';
import { SpaceCard } from './space-card';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Right column: the selected space, read at request time; a quiet error when Strapi is down. */
export async function SpaceCardIsland({
  searchParams,
  locale,
}: {
  searchParams: SearchParams;
  locale: AppLocale;
}) {
  await connection();
  const params = await searchParams;
  const slug = Array.isArray(params.category) ? params.category[0] : params.category;
  const result = await (slug ? findCategory(locale, slug) : Promise.resolve(undefined)).then(
    (category) => ({ category, error: null }),
    (error: unknown) => ({ category: null, error }),
  );
  if (result.category === null)
    return <IslandError error={errorCodeOfStrapi(result.error)} variant="quiet" />;
  return <SpaceCard category={result.category} />;
}
