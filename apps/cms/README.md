# cms

Strapi 5 backend of Communauté Le Revenu. See the [root README](../../README.md) for setup and [docs/data-model.md](../../docs/data-model.md) for the content types.

```bash
pnpm --filter cms develop            # http://localhost:1337/admin
pnpm --filter cms test:integration   # Vitest + supertest, Strapi on :1338 against lerevenu_test
pnpm --filter cms seed               # seeds the database of .env without the HTTP server
pnpm --filter cms dev:sqlite         # zero-setup mode on the committed database/demo.sqlite
```

## Layout

| Path                        | Role                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `src/api/<type>/`           | schema, controller, service, routes; `constants.ts` holds the UID                   |
| `src/api/discussion/utils/` | `slug.ts` (server-made slug), `presenter.ts` (author picked, numeric ids gone)      |
| `src/policies/is-owner.ts`  | 404 / 403 `PolicyError` on `update` and `delete` of discussions and replies         |
| `src/bootstrap/`            | env check, indexes, locales, permissions (all idempotent)                           |
| `src/seed/`                 | demo data, loaded once when `SEED_DEMO_DATA=true` and no category exists            |
| `tests/`                    | integration tests, see [ADR-0008](../../docs/adr/0008-forum-api-rules-in-strapi.md) |
| `config/env/test/`          | test database name, login rate limit off, warnings only                             |
