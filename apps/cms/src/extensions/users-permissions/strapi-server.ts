/**
 * Users & Permissions extension, two changes:
 * 1. `PUT /users/:id` and `DELETE /users/:id` run the `is-self` policy.
 * 2. A Google login on an email that already has a password logs that
 *    account in (Google verifies the email) instead of failing with
 *    "Email is already taken", and fills the display name and picture.
 */
import type { Core } from '@strapi/strapi';

const USER_UID = 'plugin::users-permissions.user';

interface Route {
  method: string;
  path: string;
  handler: string;
  config?: Record<string, unknown>;
}

type OAuthData = Record<string, string | undefined>;
type ConnectOptions = { grantResponse?: unknown } | undefined;
type Connect = (provider: string, oauthData: OAuthData, options?: ConnectOptions) => Promise<User>;
type User = { id: number; displayName?: string | null; avatarUrl?: string | null };
type ProvidersService = Record<string, unknown> & { connect: Connect };
type ProvidersFactory = (ctx: { strapi: Core.Strapi }) => ProvidersService;

interface Plugin {
  routes: Record<string, { routes: Route[] }>;
  services: Record<string, unknown>;
}

interface Profile {
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

export default (plugin: Plugin) => {
  for (const route of plugin.routes['content-api'].routes) {
    if (route.handler === 'user.update' || route.handler === 'user.destroy') {
      route.config = { ...route.config, policies: ['global::is-self'] };
    }
  }

  const original = plugin.services.providers as ProvidersFactory;
  plugin.services.providers = (ctx: { strapi: Core.Strapi }) => {
    const service = original(ctx);
    return { ...service, connect: withLinking(ctx.strapi, service.connect) };
  };

  return plugin;
};

function withLinking(strapi: Core.Strapi, connect: Connect): Connect {
  return async (provider, oauthData, options) => {
    try {
      return await connect(provider, oauthData, options);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (provider !== 'google' || !/already taken/i.test(message)) throw error;

      const profile = await fetchProfile(strapi, provider, oauthData, options);
      const email = String(profile.email ?? '').toLowerCase();
      const user = email
        ? ((await strapi.db.query(USER_UID).findOne({ where: { email } })) as User | null)
        : null;
      if (!user) throw error;

      const patch: Partial<User> = {};
      if (!user.displayName && profile.displayName) patch.displayName = profile.displayName;
      if (!user.avatarUrl && profile.avatarUrl) patch.avatarUrl = profile.avatarUrl;
      if (Object.keys(patch).length === 0) return user;
      strapi.log.info(`providers: google login linked to existing account ${user.id}`);
      return (await strapi.db
        .query(USER_UID)
        .update({ where: { id: user.id }, data: patch })) as User;
    }
  };
}

/** Same call the plugin makes internally: the registry resolves the provider profile. */
async function fetchProfile(
  strapi: Core.Strapi,
  provider: string,
  oauthData: OAuthData,
  options: ConnectOptions,
): Promise<Profile> {
  const providers = await strapi
    .store({ type: 'plugin', name: 'users-permissions', key: 'grant' })
    .get();
  const registry = strapi.plugin('users-permissions').service('providers-registry') as {
    run(args: Record<string, unknown>): Promise<Profile>;
  };
  return registry.run({
    provider,
    accessToken: oauthData.access_token ?? oauthData.code ?? oauthData.oauth_token,
    query: oauthData,
    providers,
    grantResponse: options?.grantResponse,
  });
}
