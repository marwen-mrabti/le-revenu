import type { Core } from '@strapi/strapi';

import { assertEnv } from './bootstrap/assert-env';
import { ensureEmail } from './bootstrap/ensure-email';
import { ensureGoogleProfile } from './bootstrap/ensure-google-profile';
import { ensureIndexes } from './bootstrap/ensure-indexes';
import { ensureLocales } from './bootstrap/ensure-locales';
import { ensurePermissions } from './bootstrap/ensure-permissions';
import { ensureProviders } from './bootstrap/ensure-providers';
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
   * Order matters: indexes → locales → permissions → providers → email → demo data.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureIndexes(strapi);
    await ensureLocales(strapi);
    await ensurePermissions(strapi);
    await ensureProviders(strapi);
    ensureGoogleProfile(strapi);
    await ensureEmail(strapi);
    if (process.env.SEED_DEMO_DATA === 'true') {
      await seed(strapi);
    }
  },
};
