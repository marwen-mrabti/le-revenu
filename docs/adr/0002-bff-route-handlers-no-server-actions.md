# ADR-0002 — BFF through Route Handlers, no Server Actions

**Status:** Accepted · 2026-10-23

## Context

Next.js offers Server Actions for mutations. The team preference is explicit HTTP APIs: easier to test in isolation, reusable by other clients, and clearer to review. The Next.js BFF guide sanctions Route Handlers for client-side data libraries such as TanStack Query.

## Decision

All mutations and all authentication go through `app/api/**/route.ts`. Client Components only call these routes. Server Components never call them; they import the server-only Data Access Layer directly (prerendering has no server to call).

Each handler validates its input with zod, reads the session cookie when the action needs a user, forwards the Strapi JWT, maps Strapi errors to a stable JSON shape with French messages, and never returns the JWT. Cache invalidation after a write uses `revalidateTag(tag, 'max')`, which is allowed in Route Handlers (`updateTag` is Server-Actions-only).

## Consequences

- A documented BFF contract (see README) that can be exercised with `NextRequest` in unit tests and by Playwright end to end.
- One extra hop for browser reads, accepted for the security and portability gain.
- `nextCookies()` and other Server-Action helpers are not needed.
