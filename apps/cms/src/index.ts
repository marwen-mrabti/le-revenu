import type { Core } from '@strapi/strapi';

import { assertEnv } from './bootstrap/assert-env';
import { ensureLocales } from './bootstrap/ensure-locales';

export default {
  /**
   * Runs before the application is initialized. No database access here.
   */
  register() {
    assertEnv();
  },

  /**
   * Runs before the application starts, after plugins and the database are ready.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureLocales(strapi);
  },
};
