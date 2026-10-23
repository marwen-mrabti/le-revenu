const prettier = 'prettier --write';
const quote = (files) => files.map((f) => JSON.stringify(f)).join(' ');
const eslintIn = (pkg) => (files) =>
  `pnpm --filter ${pkg} exec eslint --fix --max-warnings 0 --no-warn-ignored ${quote(files)}`;

export default {
  'apps/web/**/*.{ts,tsx,js,mjs,cjs}': [eslintIn('web'), prettier],
  'apps/cms/**/*.{ts,tsx,js,mjs,cjs}': [eslintIn('cms'), prettier],
  // Root and packages/* files use the root config; app files matched here are ignored by it.
  '*.{js,mjs,cjs,ts}': ['eslint --fix --max-warnings 0 --no-warn-ignored', prettier],
  '*.{json,md,mdx,yml,yaml,css}': [prettier],
};
