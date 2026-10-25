import { factories, type Modules } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import { contentApi, envelope, fromKoa, type ApiContext } from '../../../lib/content-api';
import { REPLY_POPULATE, present } from '../../discussion/services/presenter';

const UID = 'api::reply.reply';
const DISCUSSION_UID = 'api::discussion.discussion';

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

    /** Owner-only (policy). Author and discussion cannot be changed. */
    async update(koa) {
      koa.request.body = { data: clientData(fromKoa(koa), false) };
      return super.update(koa);
    },
  };
});
