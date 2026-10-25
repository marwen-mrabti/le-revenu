import type { Knex } from 'knex';

const TABLE = 'discussions';
const INDEX = 'discussions_created_at_idx';

/**
 * Lists are always sorted by creation date; this index keeps that cheap.
 * Portable: works on PostgreSQL and SQLite. Strapi runs `up` exactly once and
 * records it in `strapi_migrations`; Strapi has no down migrations.
 */
export default {
  async up(knex: Knex) {
    if (!(await knex.schema.hasTable(TABLE))) return;
    await knex.schema.alterTable(TABLE, (table) => {
      table.index(['created_at'], INDEX);
    });
  },
};
