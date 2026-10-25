import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

interface OwnerPolicyConfig {
  /** Content type the route operates on. */
  uid: 'api::discussion.discussion' | 'api::reply.reply';
}

/** The parts of the request a policy reads: the logged-in reader and the route param. */
interface OwnerPolicyContext {
  state: { user?: { documentId: string } };
  params: { id?: string };
}

interface Owned {
  author?: { documentId: string } | null;
}

/**
 * Lets a request through only when the logged-in reader wrote the entry.
 * 404 when the entry does not exist, 403 when it belongs to someone else.
 * Registered on `update` and `delete` of discussions and replies.
 */
export default async function isOwner(
  policyContext: OwnerPolicyContext,
  config: OwnerPolicyConfig,
  { strapi }: { strapi: Core.Strapi },
): Promise<boolean> {
  const user = policyContext.state.user;
  if (!user) return false;

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
