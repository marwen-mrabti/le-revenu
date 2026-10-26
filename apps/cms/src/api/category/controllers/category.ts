/** category controller: core behaviour, numeric ids stripped from the output. */
import { factories } from '@strapi/strapi';

import { withoutIds } from '../../discussion/utils/presenter';
import { CATEGORY_UID } from '../constants';

type Row = Record<string, unknown>;
interface Envelope<T> {
  data: T;
  meta: unknown;
}

export default factories.createCoreController(CATEGORY_UID, () => ({
  async find(ctx) {
    const { data, meta } = (await super.find(ctx)) as Envelope<Row[]>;
    return { data: data.map((row) => withoutIds(row)), meta };
  },

  async findOne(ctx) {
    const { data, meta } = (await super.findOne(ctx)) as Envelope<Row | null>;
    return { data: data ? withoutIds(data) : data, meta };
  },
}));
