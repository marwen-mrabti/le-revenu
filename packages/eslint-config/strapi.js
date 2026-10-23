import globals from 'globals';
import { base } from './base.js';

/** @type {import('eslint').Linter.Config[]} */
export const strapiConfig = [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.node, strapi: 'readonly' },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      '.strapi/**',
      '.tmp/**',
      'types/generated/**',
      'public/**',
      'database/migrations/**',
    ],
  },
];

export default strapiConfig;
