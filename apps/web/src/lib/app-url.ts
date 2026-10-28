import { env } from '@/config/env';

/**
 * Absolute URL of a path on this site, from the public app URL. Inside a
 * container Next builds `request.url` from the bind address (0.0.0.0), so a
 * redirect derived from the request would send the browser there.
 */
export function appUrl(path: string): URL {
  return new URL(path, env.NEXT_PUBLIC_APP_URL);
}
