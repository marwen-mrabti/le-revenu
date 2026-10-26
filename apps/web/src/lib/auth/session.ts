import 'server-only';

import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

import { env } from '@/config/env';

/** Seven days, like Strapi's JWT_EXPIRES_IN. */
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * The session is the Strapi JWT in a cookie the browser cannot read.
 * Everything about that cookie lives here.
 */
export function sessionCookie(jwt: string, maxAge = SESSION_MAX_AGE): string {
  const parts = [
    `${env.AUTH_COOKIE_NAME}=${encodeURIComponent(jwt)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

/** Adds the session cookie to a handler response. */
export function setSession(response: Response, jwt: string): void {
  response.headers.append('set-cookie', sessionCookie(jwt));
}

/** Expires the session cookie. */
export function clearSession(response: Response): void {
  response.headers.append('set-cookie', sessionCookie('', 0));
}

/** Session token of a handler's request, `null` when logged out. */
export function readSessionFrom(request: NextRequest): string | null {
  const value = request.cookies.get(env.AUTH_COOKIE_NAME)?.value;
  return value ? decodeURIComponent(value) : null;
}

/** Session token in a Server Component or the DAL, `null` when logged out. */
export async function readSession(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(env.AUTH_COOKIE_NAME)?.value;
  return value ? decodeURIComponent(value) : null;
}
