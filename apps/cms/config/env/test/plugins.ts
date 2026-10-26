/** The login rate limit (10 per minute per IP) would make test runs flaky. */
export default () => ({
  'users-permissions': {
    config: {
      ratelimit: { enabled: false },
    },
  },
});
