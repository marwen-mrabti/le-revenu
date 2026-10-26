import { defineConfig } from 'eslint/config';
import { strapiConfig } from '@repo/eslint-config/strapi';

export default defineConfig([
  ...strapiConfig,
  // Generated demo content: long by nature.
  { files: ['src/seed/data/**'], rules: { 'max-lines': 'off' } },
]);
