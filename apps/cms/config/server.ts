import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  // No scheduled tasks in this project. Strapi's source default is `true`.
  cron: { enabled: false },
  webhooks: {
    // Sent with every webhook; the Next.js /api/revalidate handler checks it.
    defaultHeaders: {
      'x-revalidate-secret': env('REVALIDATE_SECRET', ''),
    },
  },
});

export default config;
