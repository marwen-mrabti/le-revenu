import { defineConfig } from 'vitest/config';

/**
 * Integration tests: Strapi is started once by the global setup on port 1338
 * against the test database, and the files below talk to it over HTTP.
 * Files run one after the other because they share that instance and its data.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 15_000,
  },
});
