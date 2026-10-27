/** is-self policy: a reader may only change or delete their own account, and only a few fields of it. */
import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

/** The only fields a reader can change through PUT /users/:id. Everything else is dropped. */
const EDITABLE_FIELDS = new Set(['username', 'displayName']);

/**
 * Guards `user.update` and `user.destroy` (granted to Authenticated by
 * ensure-permissions): 401 without a session, 403 for another account, and
 * the body is reduced to the editable fields so `email`, `role`, `confirmed`,
 * `blocked`, `provider` and `password` cannot be changed this way.
 */
export default function isSelf(policyContext: Core.PolicyContext): boolean {
  const user = policyContext.state.user;
  if (!user) throw new errors.UnauthorizedError('Authentication required');

  if (String(policyContext.params.id) !== String(user.id)) {
    throw new errors.PolicyError('You can only change your own account', { policy: 'is-self' });
  }

  const body: unknown = policyContext.request.body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    for (const key of Object.keys(body)) {
      if (!EDITABLE_FIELDS.has(key)) delete (body as Record<string, unknown>)[key];
    }
  }
  return true;
}
