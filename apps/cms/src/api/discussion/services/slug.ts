import type { Core } from '@strapi/strapi';

const UID = 'api::discussion.discussion';
const MAX_LENGTH = 80;

/** "Faut-il ouvrir un PER à 45 ans ?" → "faut-il-ouvrir-un-per-a-45-ans" */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, '');
}

/**
 * Returns a slug no other discussion uses: the base slug, then `-2`, `-3`, …
 * A concurrent insert can still collide; the caller retries once on the DB
 * unique violation.
 */
export async function uniqueSlug(strapi: Core.Strapi, title: string): Promise<string> {
  const base = slugify(title) || 'discussion';
  const taken = (await strapi.documents(UID).findMany({
    filters: { slug: { $startsWith: base } },
    fields: ['slug'],
    limit: 500,
  })) as Array<{ slug: string }>;
  const existing = new Set(taken.map((d) => d.slug));
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
