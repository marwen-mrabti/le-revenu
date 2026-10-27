/** Direct reads of the test database, for the tokens Strapi only ever sends by mail. */
import { Client } from 'pg';
import { inject } from 'vitest';

function connect(): Client {
  const { secret, ...rest } = inject('database');
  return new Client({ ...rest, password: secret });
}

export async function queryOne<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  const client = connect();
  await client.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows[0] as T | undefined;
  } finally {
    await client.end();
  }
}

export async function execute(sql: string, params: unknown[] = []): Promise<void> {
  const client = connect();
  await client.connect();
  try {
    await client.query(sql, params);
  } finally {
    await client.end();
  }
}
