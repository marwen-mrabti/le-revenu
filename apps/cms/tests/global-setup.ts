/**
 * Boots one Strapi instance for the whole run, on its own port and against
 * the test database, then logs the demo readers in and shares the base URL
 * and their tokens with the test files (`inject`). Vitest runs this file in
 * its own process, which is why the tests go over HTTP instead of sharing
 * the instance.
 */
import { createRequire } from 'node:module';
import path from 'node:path';

import type * as Strapi from '@strapi/strapi';
import { Client } from 'pg';
import type { TestProject } from 'vitest/node';

import type { DemoUser, Session } from './vitest.d';

const PORT = 1338;
const HOST = '127.0.0.1';
const DEMO_USERS: DemoUser[] = ['alice', 'bob'];
const DEMO_PASSWORD = 'Password123!';
/** Compiled by `tsc --outDir` in the `test:integration` script, apart from the dev server's `dist/`. */
const DIST_DIR = '.tmp/test-dist';

interface PostgresConnection {
  client: string;
  connection: { host: string; port: number; database: string; user: string; password: string };
}

/**
 * Vite's module runner would pick Strapi's ESM build, whose lodash named
 * imports fail under Node. The CommonJS build is what the CLI itself runs.
 */
const { createStrapi } = createRequire(import.meta.url)('@strapi/strapi') as typeof Strapi;

let app: Strapi.Core.Strapi | undefined;

export async function setup(project: TestProject): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.HOST = HOST;
  process.env.PORT = String(PORT);
  process.env.SEED_DEMO_DATA = 'true';
  process.env.STRAPI_TELEMETRY_DISABLED = 'true';

  const appDir = process.cwd();
  app = createStrapi({ appDir, distDir: path.join(appDir, DIST_DIR), serveAdminPanel: false });

  await resetDatabase(app.config.get('database.connection') as PostgresConnection);
  await app.start();

  const baseUrl = `http://${HOST}:${PORT}`;
  const sessions = Object.fromEntries(
    await Promise.all(DEMO_USERS.map(async (name) => [name, await login(baseUrl, name)])),
  ) as Record<DemoUser, Session>;

  project.provide('baseUrl', baseUrl);
  project.provide('sessions', sessions);
}

export async function teardown(): Promise<void> {
  await app?.destroy();
}

/**
 * Empties the test database so every run starts from the seed. Refuses to
 * touch any database whose name does not end with `_test`.
 */
async function resetDatabase(db: PostgresConnection): Promise<void> {
  if (db.client !== 'postgres') {
    throw new Error(`Integration tests need PostgreSQL, got DATABASE_CLIENT=${db.client}`);
  }
  if (!db.connection.database.endsWith('_test')) {
    throw new Error(`Refusing to reset "${db.connection.database}": not a *_test database`);
  }
  const client = new Client(db.connection);
  await client.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  } finally {
    await client.end();
  }
}

async function login(baseUrl: string, identifier: DemoUser): Promise<Session> {
  const response = await fetch(`${baseUrl}/api/auth/local`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier, password: DEMO_PASSWORD }),
  });
  if (!response.ok) throw new Error(`Login failed for ${identifier}: ${response.status}`);
  const body = (await response.json()) as {
    jwt: string;
    user: { documentId: string; username: string };
  };
  return { jwt: body.jwt, documentId: body.user.documentId, username: body.user.username };
}
