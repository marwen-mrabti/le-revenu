import { factories } from '@strapi/strapi';

const DISCUSSION_UID = 'api::discussion.discussion';
const REPLY_UID = 'api::reply.reply';

export default factories.createCoreService(DISCUSSION_UID, ({ strapi }) => ({
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
