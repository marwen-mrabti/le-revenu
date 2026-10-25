import type { Core } from '@strapi/strapi';

import { DEMO_PASSWORD, USERS } from './data/users';

const ROLE_UID = 'plugin::users-permissions.role';
const USER_UID = 'plugin::users-permissions.user';

interface UserService {
  add(values: Record<string, unknown>): Promise<{ id: number }>;
}

/** Creates the demo readers (Authenticated role). Returns username → id. */
export async function seedUsers(strapi: Core.Strapi): Promise<Map<string, number>> {
  const role = (await strapi.db.query(ROLE_UID).findOne({ where: { type: 'authenticated' } })) as {
    id: number;
  } | null;
  if (!role) throw new Error('seed: Authenticated role not found');

  const service = strapi.plugin('users-permissions').service('user') as UserService;
  const ids = new Map<string, number>();

  for (const user of USERS) {
    const existing = (await strapi.db
      .query(USER_UID)
      .findOne({ where: { email: user.email } })) as { id: number } | null;
    if (existing) {
      ids.set(user.username, existing.id);
      continue;
    }
    // `add` goes through the Document Service, which hashes the password.
    const created = await service.add({
      username: user.username,
      email: user.email,
      password: DEMO_PASSWORD,
      role: role.id,
      confirmed: true,
      blocked: false,
      provider: 'local',
    });
    ids.set(user.username, created.id);
  }
  return ids;
}
