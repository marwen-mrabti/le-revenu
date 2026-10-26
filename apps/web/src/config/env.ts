import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const PLACEHOLDER = /change-?me|replace-?me/i;
const notPlaceholder = (value: string) => !PLACEHOLDER.test(value);

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Validated at server start (instrumentation.ts) and on first use. Server
 * values never reach the browser bundle; only NEXT_PUBLIC_* do.
 *
 * Development runs with zero files: the defaults below match the shipped
 * `apps/cms/.env.sqlite`, so `pnpm --filter web dev` works on a fresh clone.
 * Production has no defaults for secrets: the build or the boot fails loudly.
 */
const DEV_REVALIDATE_SECRET = 'demo-local-sqlite-revalidate-secret-0123456789';

export const env = createEnv({
  server: {
    STRAPI_URL: z.url().default('http://localhost:1337'),
    AUTH_COOKIE_NAME: z.string().min(1).default('lr_session'),
    REVALIDATE_SECRET: isProduction
      ? z.string().min(8).refine(notPlaceholder, 'still a placeholder')
      : z
          .string()
          .min(8)
          .refine(notPlaceholder, 'still a placeholder')
          .default(DEV_REVALIDATE_SECRET),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
    /** Shows the Google button; the cms side must hold the credentials. */
    NEXT_PUBLIC_GOOGLE_LOGIN: z.stringbool().default(false),
    /** Read by the browser for one thing only: finishing the Google flow against Strapi's session. */
    NEXT_PUBLIC_STRAPI_URL: z.url().default('http://localhost:1337'),
  },
  runtimeEnv: {
    STRAPI_URL: process.env.STRAPI_URL,
    AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GOOGLE_LOGIN: process.env.NEXT_PUBLIC_GOOGLE_LOGIN,
    NEXT_PUBLIC_STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL,
  },
  emptyStringAsUndefined: true,
});
