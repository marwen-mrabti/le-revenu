import type { Core } from '@strapi/strapi';

import { DEMO_PASSWORD, USERS } from './data/users';

const ROLE_UID = 'plugin::users-permissions.role';
const USER_UID = 'plugin::users-permissions.user';

interface UserService {
  add(values: Record<string, unknown>): Promise<{ documentId: string }>;
}

/** Creates the demo readers (Authenticated role). Returns username → documentId. */
export async function seedUsers(strapi: Core.Strapi): Promise<Map<string, string>> {
  const role = (await strapi.db.query(ROLE_UID).findOne({ where: { type: 'authenticated' } })) as {
    documentId: string;
  } | null;
  if (!role) throw new Error('seed: Authenticated role not found');

  const service = strapi.plugin('users-permissions').service('user') as UserService;
  const ids = new Map<string, string>();

  for (const user of USERS) {
    const existing = (await strapi.db
      .query(USER_UID)
      .findOne({ where: { email: user.email } })) as { documentId: string } | null;
    if (existing) {
      ids.set(user.username, existing.documentId);
      continue;
    }
    // `add` goes through the Document Service, which hashes the password.
    const created = await service.add({
      username: user.username,
      email: user.email,
      displayName: user.displayName ?? null,
      password: DEMO_PASSWORD,
      role: role.documentId,
      confirmed: true,
      blocked: false,
      provider: 'local',
    });
    ids.set(user.username, created.documentId);
  }
  return ids;
}
