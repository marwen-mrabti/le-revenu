import type { Core } from '@strapi/strapi';

/**
 * Third-party login providers, configured from the environment instead of the
 * admin panel so a fresh database behaves the same everywhere. Only Google for
 * now. Without credentials the provider stays disabled and the site works
 * with email and password only.
 *
 * Store shape (plugin `users-permissions`, key `grant`), per provider:
 * `{ icon, enabled, key, secret, callbackUrl, scope, callback }` where
 * `callback` is the front-end URL Strapi redirects to once Google answered.
 */
export async function ensureProviders(strapi: Core.Strapi): Promise<void> {
  const key = process.env.GOOGLE_CLIENT_ID?.trim() ?? '';
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? '';
  const webUrl = (process.env.WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const enabled = key !== '' && secret !== '';

  const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const grant = ((await store.get({ key: 'grant' })) ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const current = grant.google ?? {};
  const wanted = {
    ...current,
    enabled,
    key,
    secret,
    scope: ['email', 'profile'],
    callback: `${webUrl}/auth/google/callback`,
  };

  const unchanged = (['enabled', 'key', 'secret', 'callback', 'scope'] as const).every(
    (field) => JSON.stringify(current[field]) === JSON.stringify(wanted[field]),
  );
  if (unchanged) return;

  await store.set({ key: 'grant', value: { ...grant, google: wanted } });
  strapi.log.info(`providers: google ${enabled ? 'enabled' : 'disabled (no credentials)'}`);
}
