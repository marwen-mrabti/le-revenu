/**
 * Shapes what leaves the API. Two rules live here:
 * - no numeric `id` is ever exposed, only `documentId`;
 * - the author is reduced to `{ documentId, username }` (readers cannot list
 *   users, so Strapi would otherwise strip the relation entirely).
 */

import type { Modules } from '@strapi/strapi';

type Populate<T extends 'api::discussion.discussion' | 'api::reply.reply'> =
  Modules.Documents.Params.Populate.Any<T>;

export const AUTHOR_POPULATE: { fields: ['username'] } = { fields: ['username'] };
export const CATEGORY_POPULATE: { fields: ['name', 'slug', 'color'] } = {
  fields: ['name', 'slug', 'color'],
};

/** Populate for list endpoints: counts replies instead of loading them. */
export const LIST_POPULATE: Populate<'api::discussion.discussion'> = {
  author: AUTHOR_POPULATE,
  category: CATEGORY_POPULATE,
  replies: { count: true },
};

/** Populate for a single discussion: replies in chronological order with their author. */
export const DETAIL_POPULATE: Populate<'api::discussion.discussion'> = {
  author: AUTHOR_POPULATE,
  category: CATEGORY_POPULATE,
  replies: { populate: { author: AUTHOR_POPULATE }, sort: ['createdAt:asc'] },
};

export const REPLY_POPULATE: Populate<'api::reply.reply'> = { author: AUTHOR_POPULATE };

export interface PublicAuthor {
  documentId: string;
  username: string;
}

type Row = Record<string, unknown> & { documentId?: string };

/** Drops the numeric `id` of an entity and of any nested object. */
export function withoutIds<T extends Row>(row: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = row;
  for (const [key, value] of Object.entries(rest)) {
    if (Array.isArray(value)) {
      (rest as Record<string, unknown>)[key] = value.map((v) => (isRow(v) ? withoutIds(v) : v));
    } else if (isRow(value)) {
      (rest as Record<string, unknown>)[key] = withoutIds(value);
    }
  }
  return rest;
}

export function pickAuthor(author: unknown): PublicAuthor | null {
  if (!isRow(author) || typeof author.documentId !== 'string') return null;
  const username = typeof author.username === 'string' ? author.username : '';
  return { documentId: author.documentId, username };
}

/** Re-attaches a safe author to an entity sanitised without it. */
export function present<T extends Row>(
  entity: T,
  author: unknown,
): Omit<T, 'id'> & { author: PublicAuthor | null } {
  return { ...withoutIds(entity), author: pickAuthor(author) };
}

function isRow(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !(value instanceof Date);
}
