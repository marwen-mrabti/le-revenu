# ADR-0006 — Tag-based cache invalidation driven by a Strapi webhook

**Status:** Accepted · implemented in branch 06 (2026-10-27): `apps/web/src/app/api/revalidate/route.ts`, `apps/cms/src/bootstrap/ensure-webhook.ts` · 2026-10-23

## Context

With Cache Components, cached reads (categories, discussion detail) only refresh on revalidation. Writes made through the app can revalidate themselves from the Route Handler, but edits made in the Strapi admin panel would otherwise stay stale until `cacheLife` expires.

## Decision

Every DAL read is tagged `strapi:<collection>` and `strapi:<collection>:<documentId>`. BFF mutation handlers call `revalidateTag(tag, 'max')` after a successful write. Strapi registers a webhook on `entry.create`, `entry.update` and `entry.delete` for the three content types, pointing at `POST /api/revalidate` with an `x-revalidate-secret` header. The handler verifies the secret with a constant-time comparison, maps the payload's `uid` and `entry.documentId` to tags and revalidates them.

## Consequences

- Cached pages reflect admin edits within seconds, no polling and no short `cacheLife`.
- Strapi 5 does not sign webhook payloads natively; the shared secret is the baseline, HMAC with a timestamp is the production upgrade.
- The webhook is registered idempotently in Strapi's bootstrap; if the programmatic API changes, the README documents the admin-panel setup.
