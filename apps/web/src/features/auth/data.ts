import 'server-only';

import { cache } from 'react';

import { readSession } from '@/lib/auth/session';
import { strapiAuth } from '@/lib/strapi/private';

import {
  passwordStatusSchema,
  strapiUserSchema,
  toSessionUser,
  type SessionUser,
  type StrapiUser,
} from './schemas';

/** Strapi's own record of the session's reader (with its numeric id), `null` when the token is bad. */
export async function getStrapiUser(jwt: string): Promise<StrapiUser | null> {
  try {
    const user = await strapiAuth('/users/me', { jwt, schema: strapiUserSchema });
    return user.blocked ? null : user;
  } catch {
    return null;
  }
}

/** Validates a session token against Strapi; `null` when it is missing, expired or blocked. */
export async function getUserForToken(jwt: string): Promise<SessionUser | null> {
  const user = await getStrapiUser(jwt);
  return user ? toSessionUser(user) : null;
}

/**
 * The logged-in reader for Server Components, once per request. Reads the
 * cookie, so the caller must sit under a Suspense boundary.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jwt = await readSession();
  return jwt ? getUserForToken(jwt) : null;
});

/** Whether the session's reader has a password (a Google sign-up has none until they set one). */
export async function getPasswordStatus(jwt: string): Promise<boolean> {
  const { hasPassword } = await strapiAuth('/auth/password-status', {
    jwt,
    schema: passwordStatusSchema,
  });
  return hasPassword;
}
