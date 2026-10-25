import path from 'node:path';

import { createStrapi } from '@strapi/strapi';

import { seed } from '../src/seed';

/** `pnpm --filter cms seed`: boots Strapi without the HTTP server, seeds, exits. */
async function main() {
  const appDir = process.cwd();
  const app = await createStrapi({ appDir, distDir: path.join(appDir, 'dist') }).load();
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
