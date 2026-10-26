import type { Core } from '@strapi/strapi';

/**
 * Extra indexes on Strapi-managed tables. Created here, after Strapi has
 * synced the schema, because Strapi runs `database/migrations` *before* the
 * sync: on a fresh database the tables would not exist yet.
 * `IF NOT EXISTS` makes it idempotent on PostgreSQL and SQLite alike.
 */
const INDEXES = [
  { table: 'discussions', name: 'discussions_created_at_idx', columns: ['created_at'] },
] as const;

export async function ensureIndexes(strapi: Core.Strapi): Promise<void> {
  const knex = strapi.db.connection;
  for (const index of INDEXES) {
    if (!(await knex.schema.hasTable(index.table))) continue;
    await knex.raw(
      `CREATE INDEX IF NOT EXISTS ?? ON ?? (${index.columns.map(() => '??').join(', ')})`,
      [index.name, index.table, ...index.columns],
    );
  }
}
