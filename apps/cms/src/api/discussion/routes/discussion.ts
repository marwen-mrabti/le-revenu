/** discussion router: core routes, owner policy on update and delete. */
import { factories } from '@strapi/strapi';

import { DISCUSSION_UID } from '../constants';

const owner = { policies: [{ name: 'global::is-owner', config: { uid: DISCUSSION_UID } }] };

export default factories.createCoreRouter(DISCUSSION_UID, {
  config: {
    update: owner,
    delete: owner,
  },
});
