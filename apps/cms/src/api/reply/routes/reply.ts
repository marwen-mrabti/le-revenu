/** reply router: core routes, owner policy on update and delete. */
import { factories } from '@strapi/strapi';

import { REPLY_UID } from '../constants';

const owner = { policies: [{ name: 'global::is-owner', config: { uid: REPLY_UID } }] };

export default factories.createCoreRouter(REPLY_UID, {
  config: {
    update: owner,
    delete: owner,
  },
});
