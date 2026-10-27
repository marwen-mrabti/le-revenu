import type { Core } from '@strapi/strapi';

const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

interface GoogleProvider {
  enabled: boolean;
  icon: string;
  grantConfig: { key: string; secret: string; callbackUrl: string; scope: string[] };
  authCallback(args: { accessToken: string }): Promise<Record<string, unknown>>;
}

interface Registry {
  get(name: string): GoogleProvider | undefined;
  add(name: string, provider: GoogleProvider): void;
}

/**
 * Strapi's Google provider only asks for the email. We ask for the profile
 * too and read Google's userinfo endpoint, so a first login stores the
 * reader's name and picture (`displayName`, `avatarUrl`). The username stays
 * derived from the email, made unique by Strapi.
 */
export function ensureGoogleProfile(strapi: Core.Strapi): void {
  const registry = strapi.plugin('users-permissions').service('providers-registry') as Registry;
  const base = registry.get('google');
  if (!base) return;

  registry.add('google', {
    ...base,
    grantConfig: { ...base.grantConfig, scope: ['email', 'profile'] },
    async authCallback({ accessToken }) {
      const response = await fetch(USERINFO_URL, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error(`Google userinfo answered ${response.status}`);
      const body = (await response.json()) as {
        email?: string;
        email_verified?: boolean;
        name?: string;
        picture?: string;
      };
      if (!body.email || body.email_verified !== true) {
        throw new Error('Email not verified by Google');
      }
      return {
        username: body.email.split('@')[0],
        email: body.email,
        displayName: body.name?.slice(0, 60),
        avatarUrl: body.picture?.slice(0, 500),
      };
    },
  });
}
