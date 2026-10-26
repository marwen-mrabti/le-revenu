import type { Core } from '@strapi/strapi';

/**
 * Test runs target a separate database so the dev data is never touched.
 * Its own variable on purpose: falling back to DATABASE_NAME would point the
 * test harness (which drops the schema) at the development database.
 */
const config = ({ env }: Core.Config.Shared.ConfigParams) => ({
  connection: {
    connection: {
      database: env('DATABASE_TEST_NAME', 'lerevenu_test'),
    },
  },
});

export default config;
