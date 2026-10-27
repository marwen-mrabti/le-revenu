/**
 * Users & Permissions extension, four changes:
 * 1. `PUT /users/:id` and `DELETE /users/:id` run the `is-self` policy.
 * 2. A Google login on an email that already has a password logs that
 *    account in (Google verifies the email) instead of failing with
 *    "Email is already taken", and fills the display name and picture.
 * 3. Every Google login fills an empty display name or picture.
 * 4. `GET /auth/password-status` and `POST /auth/set-password`: a reader whose
 *    account has no password (Google sign-up) sets one without a current password.
 */
import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import { PASSWORD_MAX, PASSWORD_MIN } from '../../lib/constants';

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

type Handler = (ctx: Core.PolicyContext) => Promise<void>;
type Controller = Record<string, Handler>;
/** Strapi 5 plugin controllers are factories; an older plugin may still export plain objects. */
type ControllerDef = Controller | ((ctx: { strapi: Core.Strapi }) => Controller);

interface Plugin {
  routes: Record<string, { routes: Route[] }>;
  services: Record<string, unknown>;
  controllers: Record<string, ControllerDef>;
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

  const auth = plugin.controllers.auth;
  const added: Controller = { passwordStatus, setPassword };
  plugin.controllers.auth =
    typeof auth === 'function' ? (ctx) => ({ ...auth(ctx), ...added }) : { ...auth, ...added };
  plugin.routes['content-api'].routes.push(
    {
      method: 'GET',
      path: '/auth/password-status',
      handler: 'auth.passwordStatus',
      config: { prefix: '' },
    },
    {
      method: 'POST',
      path: '/auth/set-password',
      handler: 'auth.setPassword',
      config: { prefix: '', middlewares: ['plugin::users-permissions.rateLimit'] },
    },
  );

  const original = plugin.services.providers as ProvidersFactory;
  plugin.services.providers = (ctx: { strapi: Core.Strapi }) => {
    const service = original(ctx);
    return { ...service, connect: withLinking(ctx.strapi, service.connect) };
  };

  return plugin;
};

type UserWithPassword = User & { password?: string | null };

/** `{ hasPassword }` for the logged-in reader: decides which password form the account page shows. */
async function passwordStatus(ctx: Core.PolicyContext): Promise<void> {
  const me = ctx.state.user;
  if (!me) throw new errors.UnauthorizedError('Connectez-vous pour continuer.');
  const user = (await strapi.db
    .query(USER_UID)
    .findOne({ where: { id: me.id }, select: ['id', 'password'] })) as UserWithPassword | null;
  ctx.body = { hasPassword: Boolean(user?.password) };
}

/**
 * First password of an account created through Google: no current password to check.
 * Refused once a password exists (change-password is the route for that). The
 * provider becomes `local`: Strapi's local login only looks at local accounts, and a
 * later Google login on this email goes through the linking path above.
 */
async function setPassword(ctx: Core.PolicyContext): Promise<void> {
  const me = ctx.state.user;
  if (!me) throw new errors.UnauthorizedError('Connectez-vous pour continuer.');
  const body = (ctx.request.body ?? {}) as { password?: unknown; passwordConfirmation?: unknown };
  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    throw new errors.ValidationError(
      `password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters`,
    );
  }
  if (body.passwordConfirmation !== password) {
    throw new errors.ValidationError('Passwords do not match');
  }
  const user = (await strapi.db
    .query(USER_UID)
    .findOne({ where: { id: me.id }, select: ['id', 'password'] })) as UserWithPassword | null;
  if (!user) throw new errors.UnauthorizedError('Connectez-vous pour continuer.');
  if (user.password) ctx.throw(409, 'Password already set');

  // The user service hashes the password through the plugin's lifecycle.
  const userService = strapi.plugin('users-permissions').service('user') as {
    edit(id: number, data: Record<string, unknown>): Promise<unknown>;
  };
  await userService.edit(user.id, { password, provider: 'local' });
  strapi.log.info(`auth: password set for account ${user.id}`);
  ctx.body = { ok: true };
}

function withLinking(strapi: Core.Strapi, connect: Connect): Connect {
  return async (provider, oauthData, options) => {
    try {
      const user = await connect(provider, oauthData, options);
      return provider === 'google'
        ? backfillProfile(strapi, user, provider, oauthData, options)
        : user;
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

/** An account created before the profile scope existed gets its name and picture on its next login. */
async function backfillProfile(
  strapi: Core.Strapi,
  user: User,
  provider: string,
  oauthData: OAuthData,
  options: ConnectOptions,
): Promise<User> {
  if (user.displayName && user.avatarUrl) return user;
  try {
    const profile = await fetchProfile(strapi, provider, oauthData, options);
    const patch: Partial<User> = {};
    if (!user.displayName && profile.displayName) patch.displayName = profile.displayName;
    if (!user.avatarUrl && profile.avatarUrl) patch.avatarUrl = profile.avatarUrl;
    if (Object.keys(patch).length === 0) return user;
    return (await strapi.db
      .query(USER_UID)
      .update({ where: { id: user.id }, data: patch })) as User;
  } catch (error) {
    // The login itself succeeded: a missing picture must not block it.
    strapi.log.warn(`providers: google profile not read (${String(error)})`);
    return user;
  }
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
