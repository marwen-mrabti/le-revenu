/** reply controller */
import { factories, type Modules } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import { contentApi, envelope, fromKoa, type ApiContext } from '../../../lib/content-api';
import { DISCUSSION_UID } from '../../discussion/constants';
import { REPLY_POPULATE, present } from '../../discussion/utils/presenter';
import { REPLY_UID as UID } from '../constants';

type Row = Record<string, unknown>;
type Input = Modules.Documents.Params.Data.Input<typeof UID>;

/** The author is always the session user; a reply never moves to another discussion. */
function clientData(ctx: ApiContext, keepDiscussion: boolean): Row {
  const { author: _author, discussion, ...rest } = ctx.request.body?.data ?? {};
  return keepDiscussion ? { ...rest, discussion } : rest;
}

export default factories.createCoreController(UID, ({ strapi }) => {
  const api = contentApi(strapi, UID);

  const presentRow = async (row: Row, ctx: ApiContext) => {
    const { author, ...rest } = row;
    return present(await api.output(rest, ctx), author);
  };

  return {
    async find(koa) {
      const ctx = fromKoa(koa);
      const query = await api.query(ctx);
      const { results, pagination } = (await strapi.service(UID).find({
        ...query,
        sort: query.sort ?? ['createdAt:asc'],
        populate: REPLY_POPULATE,
      })) as { results: Row[]; pagination: Record<string, unknown> };
      const data = await Promise.all(results.map((row) => presentRow(row, ctx)));
      return envelope(data, { pagination });
    },

    /** Creates a reply for the logged-in reader inside an existing discussion. */
    async create(koa) {
      const ctx = fromKoa(koa);
      const user = ctx.state.user as { documentId: string };
      const input = await api.input(clientData(ctx, true), ctx);
      const discussionId = typeof input.discussion === 'string' ? input.discussion : '';
      const discussion = await strapi
        .documents(DISCUSSION_UID)
        .findOne({ documentId: discussionId });
      if (!discussion) throw new errors.NotFoundError('Discussion not found');

      const data = { ...input, author: user.documentId } as Input;
      const row = await strapi.documents(UID).create({ data, populate: REPLY_POPULATE });
      ctx.status = 201;
      return envelope(await presentRow(row as Row, ctx));
    },

    /** Owner-only (policy). Author and discussion cannot be changed; answers like `create` (author populated). */
    async update(koa) {
      const ctx = fromKoa(koa);
      const data = (await api.input(clientData(ctx, false), ctx)) as Input;
      const row = await strapi
        .documents(UID)
        .update({ documentId: String(ctx.params.id), data, populate: REPLY_POPULATE });
      if (!row) throw new errors.NotFoundError('Reply not found');
      return envelope(await presentRow(row as Row, ctx));
    },
  };
});
