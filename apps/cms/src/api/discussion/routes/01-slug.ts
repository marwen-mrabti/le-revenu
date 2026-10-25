/** Public lookup by slug: the clean URL of a discussion. */
export default {
  routes: [
    {
      method: 'GET',
      path: '/discussions/slug/:slug',
      handler: 'discussion.findBySlug',
    },
  ],
};
