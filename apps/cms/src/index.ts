import type { Core } from '@strapi/strapi';

import { assertEnv } from './bootstrap/assert-env';
import { ensureIndexes } from './bootstrap/ensure-indexes';
import { ensureLocales } from './bootstrap/ensure-locales';
import { ensurePermissions } from './bootstrap/ensure-permissions';
import { seed } from './seed';

export default {
  /**
   * Runs before the application is initialized. No database access here.
   */
  register() {
    assertEnv();
  },

  /**
   * Runs before the application starts, after plugins and the database are ready.
   * Order matters: indexes → locales → permissions → demo data.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureIndexes(strapi);
    await ensureLocales(strapi);
    await ensurePermissions(strapi);
    if (process.env.SEED_DEMO_DATA === 'true') {
      await seed(strapi);
    }
  },
};
