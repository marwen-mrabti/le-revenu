import type { Core } from '@strapi/strapi';

import { CATEGORY_UID } from '../api/category/constants';
import { DISCUSSION_UID } from '../api/discussion/constants';
import { REPLY_UID } from '../api/reply/constants';

/** What anonymous visitors may do: read everything, write nothing. */
const PUBLIC_ACTIONS = [
  `${CATEGORY_UID}.find`,
  `${CATEGORY_UID}.findOne`,
  `${DISCUSSION_UID}.find`,
  `${DISCUSSION_UID}.findOne`,
  `${DISCUSSION_UID}.findBySlug`,
  `${REPLY_UID}.find`,
  `${REPLY_UID}.findOne`,
];

/** Logged-in readers: everything Public can, plus writing. Ownership is checked by policies. */
const AUTHENTICATED_ACTIONS = [
  ...PUBLIC_ACTIONS,
  `${DISCUSSION_UID}.create`,
  `${DISCUSSION_UID}.update`,
  `${DISCUSSION_UID}.delete`,
  `${REPLY_UID}.create`,
  `${REPLY_UID}.update`,
  `${REPLY_UID}.delete`,
  // Own account only: the is-self policy (users-permissions extension) guards both.
  'plugin::users-permissions.user.update',
  'plugin::users-permissions.user.destroy',
  // First password of a Google account, own account only (users-permissions extension).
  'plugin::users-permissions.auth.passwordStatus',
  'plugin::users-permissions.auth.setPassword',
];

const ROLE_UID = 'plugin::users-permissions.role';
const PERMISSION_UID = 'plugin::users-permissions.permission';

interface Role {
  id: number;
  type: string;
}

/**
 * Grants the forum permissions to the two reader roles. Additive and idempotent:
 * rows are only ever added, never removed, so the plugin's own defaults
 * (`user.me`, `auth.*`) survive. `plugin::users-permissions.user.find` is never
 * granted: it would expose /api/users and reader emails.
 */
export async function ensurePermissions(strapi: Core.Strapi): Promise<void> {
  await grant(strapi, 'public', PUBLIC_ACTIONS);
  await grant(strapi, 'authenticated', AUTHENTICATED_ACTIONS);
  await ensureSignUp(strapi);
}

async function grant(strapi: Core.Strapi, roleType: string, actions: string[]): Promise<void> {
  const role = (await strapi.db
    .query(ROLE_UID)
    .findOne({ where: { type: roleType } })) as Role | null;
  if (!role) {
    strapi.log.warn(`permissions: role "${roleType}" not found, skipping`);
    return;
  }
  let added = 0;
  for (const action of actions) {
    const existing = await strapi.db
      .query(PERMISSION_UID)
      .findOne({ where: { action, role: role.id } });
    if (!existing) {
      await strapi.db.query(PERMISSION_UID).create({ data: { action, role: role.id } });
      added += 1;
    }
  }
  if (added > 0) strapi.log.info(`permissions: ${roleType} +${added}`);
}

/**
 * Readers can create an account from the site (sign-up page). Keeps the plugin's
 * other settings intact by merging into the existing object.
 */
async function ensureSignUp(strapi: Core.Strapi): Promise<void> {
  const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const advanced = ((await store.get({ key: 'advanced' })) ?? {}) as Record<string, unknown>;
  if (advanced.allow_register === true && advanced.default_role === 'authenticated') return;
  await store.set({
    key: 'advanced',
    value: { ...advanced, allow_register: true, default_role: 'authenticated' },
  });
  strapi.log.info('permissions: public sign-up enabled');
}
