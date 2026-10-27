/**
 * Cache tags shared by the data layer, the BFF mutation handlers and the
 * Strapi webhook handler (ADR-0006): `strapi:<collection>` for every read of
 * a collection, `strapi:<collection>:<documentId>` for one entry.
 */
export const COLLECTIONS = {
  'api::category.category': 'categories',
  'api::discussion.discussion': 'discussions',
  'api::reply.reply': 'replies',
} as const;

export type StrapiUid = keyof typeof COLLECTIONS;
export type Collection = (typeof COLLECTIONS)[StrapiUid];

export const collectionTag = (collection: Collection) => `strapi:${collection}` as const;
export const entryTag = (collection: Collection, documentId: string) =>
  `strapi:${collection}:${documentId}` as const;

/** Tags a Strapi webhook event maps to; `null` for a content type we do not cache. */
export function tagsForEvent(uid: string, documentId: string | undefined): string[] | null {
  if (!(uid in COLLECTIONS)) return null;
  const collection = COLLECTIONS[uid as StrapiUid];
  const tags: string[] = [collectionTag(collection)];
  if (documentId) tags.push(entryTag(collection, documentId));
  return tags;
}
