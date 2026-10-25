import { factories } from '@strapi/strapi';

const uid = 'api::reply.reply';
const owner = { policies: [{ name: 'global::is-owner', config: { uid } }] };

export default factories.createCoreRouter(uid, {
  config: {
    update: owner,
    delete: owner,
  },
});
