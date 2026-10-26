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
