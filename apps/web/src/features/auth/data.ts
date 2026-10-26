import 'server-only';

import { cache } from 'react';

import { readSession } from '@/lib/auth/session';
import { strapiAuth } from '@/lib/strapi/private';

import { strapiUserSchema, toSessionUser, type SessionUser } from './schemas';

/** Validates a session token against Strapi; `null` when it is missing, expired or blocked. */
export async function getUserForToken(jwt: string): Promise<SessionUser | null> {
  try {
    const user = await strapiAuth('/users/me', { jwt, schema: strapiUserSchema });
    return user.blocked ? null : toSessionUser(user);
  } catch {
    return null;
  }
}

/**
 * The logged-in reader for Server Components, once per request. Reads the
 * cookie, so the caller must sit under a Suspense boundary.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jwt = await readSession();
  return jwt ? getUserForToken(jwt) : null;
});
