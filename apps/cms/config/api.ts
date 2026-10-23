import type { Core } from '@strapi/strapi';

const config: Core.Config.Api = {
  rest: {
    // Pagination always comes from the backend; the UI never slices arrays.
    defaultLimit: 10,
    maxLimit: 50,
    withCount: true,
    strictParams: true,
  },
  documents: {
    strictParams: true,
    strictRelations: true,
  },
};

export default config;
