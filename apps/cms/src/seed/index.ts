import type { Core } from '@strapi/strapi';

import { CATEGORY_UID } from '../api/category/constants';
import { seedCategories } from './categories';
import { seedDiscussions } from './discussions';
import { seedUsers } from './users';

/**
 * Loads the demo data once. Guarded by "no category exists yet" and wrapped in
 * a single transaction, so a failure leaves the database empty and the guard
 * intact for the next boot.
 */
export async function seed(strapi: Core.Strapi): Promise<'seeded' | 'skipped'> {
  const existing = await strapi.documents(CATEGORY_UID).count({ locale: 'fr' });
  if (existing > 0) {
    strapi.log.info('seed: data already present, skipping');
    return 'skipped';
  }

  await strapi.db.transaction(async () => {
    const users = await seedUsers(strapi);
    const categories = await seedCategories(strapi);
    const discussions = await seedDiscussions(strapi, { users, categories });
    strapi.log.info(
      `seed: ${users.size} users, ${categories.size} categories, ${discussions} discussions`,
    );
  });
  return 'seeded';
}
