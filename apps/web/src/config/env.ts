import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const PLACEHOLDER = /change-?me|replace-?me/i;
const notPlaceholder = (value: string) => !PLACEHOLDER.test(value);

/**
 * Validated once at boot (imported by next.config.ts) and on first use.
 * Server values never reach the browser bundle; only NEXT_PUBLIC_* do.
 */
export const env = createEnv({
  server: {
    STRAPI_URL: z.url(),
    AUTH_COOKIE_NAME: z.string().min(1).default('lr_session'),
    REVALIDATE_SECRET: z.string().min(8).refine(notPlaceholder, 'still a placeholder'),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
  },
  runtimeEnv: {
    STRAPI_URL: process.env.STRAPI_URL,
    AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
});
