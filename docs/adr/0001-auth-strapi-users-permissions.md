# ADR-0001 — Strapi Users & Permissions as the only identity provider

**Status:** Accepted · 2026-10-23

## Context

The brief requires that every discussion and reply be linked to a user, that unauthenticated users cannot post, that a user cannot post as someone else, and that permissions are configured in Strapi. It also states that Next.js must not access PostgreSQL directly nor implement a parallel business backend, and that full authentication is optional: the Users & Permissions plugin with demo users is suggested.

better-auth (with a drizzle adapter) was evaluated as the preferred auth library. It needs its own `user`, `session`, `account` and `verification` tables in PostgreSQL, hashes passwords with scrypt while Strapi uses bcrypt, and would require a custom `content-api` authentication strategy in Strapi (undocumented API) to verify its JWTs through JWKS and map them to a mirror Strapi user.

## Decision

Strapi Users & Permissions is the single identity provider. Next.js never stores identity. Login goes through a Route Handler that proxies `POST /api/auth/local` and stores the Strapi JWT in an httpOnly, SameSite=Lax cookie. Every write forwards that JWT to Strapi, which forces the author from `ctx.state.user` and applies role permissions and ownership policies.

## Consequences

- One identity store, one password hasher, one place to seed demo users.
- The browser never sees the JWT; the Strapi URL is never exposed client-side.
- Public sign-up is disabled; demo accounts are seeded.
- better-auth remains a documented evolution path: better-auth + `jwt` plugin (EdDSA, JWKS) + a Strapi strategy registered with `strapi.get('auth').register('content-api', …)` that resolves a mirror user keyed by the external id. Estimated 12 to 20 hours; not justified by the brief.
