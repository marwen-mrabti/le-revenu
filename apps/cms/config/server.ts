import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    // Sent with every webhook; the Next.js /api/revalidate handler checks it.
    defaultHeaders: {
      'x-revalidate-secret': env('REVALIDATE_SECRET', ''),
    },
  },
});

export default config;
