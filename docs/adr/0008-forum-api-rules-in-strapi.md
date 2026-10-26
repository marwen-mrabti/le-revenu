# ADR-0008 — Forum rules enforced in Strapi, document ids only, tests over HTTP

**Status:** Accepted · 2026-10-26

## Context

The brief asks for three content types (category, discussion, reply), four behaviours that must hold whatever the client sends (title of at least 10 characters, no anonymous post, no author spoofing, a readable list) and automated tests that prove them. The Next.js app is only one client of the API; the rules must survive a direct `curl`. Strapi 5 brings Draft & Publish, numeric ids next to `documentId`, and a test story that assumes the test runner and Strapi share one process.

## Decision

- **Draft & Publish off** on the three types. With it on, the validator skips `required` and `minLength` on drafts and drafts disappear from public reads, so the 10-character rule could be bypassed by saving a draft. A forum post is live the moment it is created.
- **Rules live in the controllers and policies, not in the client.** `create` drops `author` and `slug` from the body before validation, then sets `author` from the session and a server-made slug. `update` does the same, and a reply can never change its `discussion`. An `is-owner` policy on `update` and `delete` loads the entry with its author and answers 404 when missing, 403 `PolicyError` when the caller is not the author. Deleting a discussion deletes its replies in one transaction.
- **Only `documentId` leaves the API.** Readers never get `user.find` (it would expose `/api/users` and emails), so Strapi strips the `author` relation; a presenter re-attaches `{ documentId, username }` and removes every numeric `id`, on discussions, replies and categories alike. Clients reference relations by `documentId`.
- **Permissions set in code at boot**, additively and idempotently, so a fresh database has the right roles without touching the admin panel. Sign-up stays open (the site has a sign-up page).
- **Integration tests over HTTP.** Vitest's global setup runs in its own process, so it cannot hand a Strapi instance to the test workers. It compiles the app with `tsc` into `.tmp/test-dist`, drops the `lerevenu_test` schema (refusing any database whose name does not end with `_test`), starts Strapi on port 1338 with `NODE_ENV=test`, logs the demo readers in and shares the base URL and tokens through `provide`/`inject`. Test files run sequentially with supertest. CI runs them against a PostgreSQL service.

## Consequences

- No moderation queue: there is no draft state. A moderation feature would add its own flag rather than reopen Draft & Publish.
- Every custom read endpoint must go through the presenter; a plain core controller leaks `id` (the category controller was overridden for that reason).
- A test run takes about 15 s and needs PostgreSQL; the SQLite zero-setup mode is for evaluation, not for the test suite.
- `strapi ts:compile` does not exist in Strapi 5.59; the `seed` and `test:integration` scripts call `tsc` directly with an `--outDir` outside `dist/`, so they never collide with a running `strapi develop`.
