/** discussion service */
import { factories } from '@strapi/strapi';

import { REPLY_UID } from '../../reply/constants';
import { DISCUSSION_UID } from '../constants';

const discussionService = factories.createCoreService(DISCUSSION_UID, ({ strapi }) => ({
  /**
   * Deletes a discussion and its replies in one transaction. Strapi alone would
   * leave the replies behind with a null discussion.
   */
  async deleteWithReplies(documentId: string): Promise<void> {
    await strapi.db.transaction(async () => {
      const replies = await strapi.documents(REPLY_UID).findMany({
        filters: { discussion: { documentId } },
        fields: ['documentId'],
        limit: -1,
      });
      for (const reply of replies) {
        await strapi.documents(REPLY_UID).delete({ documentId: reply.documentId });
      }
      await strapi.documents(DISCUSSION_UID).delete({ documentId });
    });
  },
}));

export default discussionService;

/** Shape of `strapi.service(DISCUSSION_UID)`: core methods plus the ones above. */
export type DiscussionService = ReturnType<typeof discussionService>;
