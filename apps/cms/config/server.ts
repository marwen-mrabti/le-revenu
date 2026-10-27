import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // Absolute public URL, required (assert-env): login providers and the confirmation mail link are built from it.
  url: env('PUBLIC_URL'),
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
