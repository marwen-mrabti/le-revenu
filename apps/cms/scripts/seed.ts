import path from 'node:path';

import { createStrapi } from '@strapi/strapi';

import { seed } from '../src/seed';

/** `pnpm --filter cms seed`: boots Strapi without the HTTP server, seeds, exits. */
async function main() {
  const appDir = process.cwd();
  // This file runs compiled; the folder above it is the compiled tree (`tsc --outDir`).
  const distDir = path.resolve(__dirname, '..');
  const app = await createStrapi({ appDir, distDir }).load();
  try {
    const result = await seed(app);
    app.log.info(`seed script: ${result}`);
  } finally {
    await app.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
