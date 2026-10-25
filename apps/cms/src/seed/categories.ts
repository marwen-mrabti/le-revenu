import type { Core } from '@strapi/strapi';

import { CATEGORIES } from './data/categories';

const UID = 'api::category.category';

/** Creates each category in French, then its English version. Returns slug → documentId. */
export async function seedCategories(strapi: Core.Strapi): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const category of CATEGORIES) {
    const fr = await strapi.documents(UID).create({
      locale: 'fr',
      data: {
        name: category.fr.name,
        description: category.fr.description,
        slug: category.slug,
        color: category.color,
      },
    });
    // An update with a locale that does not exist yet creates that locale version.
    // `uid` fields are stored per locale, so the slug is passed again (same value).
    await strapi.documents(UID).update({
      documentId: fr.documentId,
      locale: 'en',
      data: { name: category.en.name, description: category.en.description, slug: category.slug },
    });
    ids.set(category.slug, fr.documentId);
  }
  return ids;
}
