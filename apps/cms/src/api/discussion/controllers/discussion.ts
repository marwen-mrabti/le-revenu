/** discussion controller */
import { factories, type Modules } from '@strapi/strapi';
import { errors } from '@strapi/utils';

import { contentApi, envelope, fromKoa, type ApiContext } from '../../../lib/content-api';
import { DISCUSSION_UID as UID } from '../constants';
import type { DiscussionService } from '../services/discussion';
import { DETAIL_POPULATE, LIST_POPULATE, present, withoutIds } from '../utils/presenter';
import { uniqueSlug } from '../utils/slug';

const DEFAULT_SORT = ['createdAt:desc'];

type Row = Record<string, unknown>;
type Input = Modules.Documents.Params.Data.Input<typeof UID>;

/** Fields the server owns: whatever the client sends for them is dropped. */
function clientData(ctx: ApiContext): Row {
  const { author: _author, slug: _slug, ...data } = ctx.request.body?.data ?? {};
  return data;
}

export default factories.createCoreController(UID, ({ strapi }) => {
  const api = contentApi(strapi, UID);

  const presentRow = async (row: Row, ctx: ApiContext) => {
    const { author, ...rest } = row;
    return present(await api.output(rest, ctx), author);
  };

  const presentDetail = async (row: Row, ctx: ApiContext) => {
    const { replies, ...rest } = row;
    const list = Array.isArray(replies) ? (replies as Row[]) : [];
    return {
      ...(await presentRow(rest, ctx)),
      replies: await Promise.all(
        list.map(async (reply) => withoutIds(await presentRow(reply, ctx))),
      ),
    };
  };

  return {
    /** Paginated list. Population is fixed server-side; filters, sort and pagination come from the client. */
    async find(koa) {
      const ctx = fromKoa(koa);
      const query = await api.query(ctx);
      const { results, pagination } = (await strapi.service(UID).find({
        ...query,
        sort: query.sort ?? DEFAULT_SORT,
        populate: LIST_POPULATE,
      })) as { results: Row[]; pagination: Record<string, unknown> };
      const data = await Promise.all(results.map((row) => presentRow(row, ctx)));
      return envelope(data, { pagination });
    },

    /** One discussion by its slug, replies in chronological order. */
    async findBySlug(koa) {
      const ctx = fromKoa(koa);
      const slug = String(ctx.params.slug ?? '');
      const [row] = await strapi
        .documents(UID)
        .findMany({ filters: { slug }, populate: DETAIL_POPULATE, limit: 1 });
      if (!row) throw new errors.NotFoundError('Discussion not found');
      return envelope(await presentDetail(row as Row, ctx));
    },

    /** Creates a discussion for the logged-in reader. Client-supplied author and slug are ignored. */
    async create(koa) {
      const ctx = fromKoa(koa);
      const user = ctx.state.user as { documentId: string };
      const input = await api.input(clientData(ctx), ctx);
      const title = typeof input.title === 'string' ? input.title : '';
      // `input` is validated and sanitised against the schema above; the cast only narrows the record type.
      const data = {
        ...input,
        slug: await uniqueSlug(strapi, title),
        author: user.documentId,
      } as Input;
      const row = await strapi.documents(UID).create({ data, populate: LIST_POPULATE });
      ctx.status = 201;
      return envelope(await presentRow(row as Row, ctx));
    },

    /** Owner-only (policy). Author and slug cannot be changed; answers like the list (author, category, count). */
    async update(koa) {
      const ctx = fromKoa(koa);
      const data = (await api.input(clientData(ctx), ctx)) as Input;
      const row = await strapi
        .documents(UID)
        .update({ documentId: String(ctx.params.id), data, populate: LIST_POPULATE });
      if (!row) throw new errors.NotFoundError('Discussion not found');
      return envelope(await presentRow(row as Row, ctx));
    },

    /** Owner-only (policy). Removes the replies with the discussion. */
    async delete(ctx) {
      const service = strapi.service(UID) as DiscussionService;
      await service.deleteWithReplies(String(ctx.params.id));
      ctx.status = 204;
    },
  };
});
