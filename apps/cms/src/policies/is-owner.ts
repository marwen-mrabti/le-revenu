/** is-owner policy: the logged-in reader must be the author of the entry. */
import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import type { DISCUSSION_UID } from '../api/discussion/constants';
import type { REPLY_UID } from '../api/reply/constants';

interface OwnerPolicyConfig {
  /** Content type the route operates on. */
  uid: typeof DISCUSSION_UID | typeof REPLY_UID;
}

interface Owned {
  author?: { documentId: string } | null;
}

/**
 * Lets a request through only when the logged-in reader wrote the entry.
 * 401 without a user, 404 when the entry does not exist, 403 when it belongs
 * to someone else. Registered on `update` and `delete` of discussions and replies.
 */
export default async function isOwner(
  policyContext: Core.PolicyContext,
  config: OwnerPolicyConfig,
  { strapi }: { strapi: Core.Strapi },
): Promise<boolean> {
  const user = policyContext.state.user;
  if (!user) throw new errors.UnauthorizedError('Authentication required');

  const documentId = String(policyContext.params.id ?? '');
  const entry = (await strapi.documents(config.uid).findOne({
    documentId,
    populate: { author: { fields: ['documentId'] } },
  })) as Owned | null;

  if (!entry) throw new errors.NotFoundError('Entry not found');
  if (entry.author?.documentId !== user.documentId) {
    throw new errors.PolicyError('Only the author can modify this entry', { policy: 'is-owner' });
  }
  return true;
}
