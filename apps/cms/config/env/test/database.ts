import type { Core } from '@strapi/strapi';

/** Test runs target a separate database so the dev data is never touched. */
const config = ({ env }: Core.Config.Shared.ConfigParams) => ({
  connection: {
    connection: {
      database: env('DATABASE_NAME', 'lerevenu_test'),
    },
  },
});

export default config;
