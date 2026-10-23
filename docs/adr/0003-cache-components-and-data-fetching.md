# ADR-0003 — Cache Components, Data Access Layer and TanStack Query

**Status:** Accepted · 2026-10-23

## Context

Next.js 16.4 enables Cache Components by default for new apps and they become the default in Next 17. Under this model nothing is cached unless marked with `'use cache'`, and any request-time read (cookies, search params) must sit under a Suspense boundary. The Next.js data security guide recommends a Data Access Layer for new projects. TanStack Query's advanced-SSR guide describes prefetch on the server and hydration on the client.

## Decision

- Cache Components stay enabled. Pages are a static shell with Suspense boundaries around request-time parts.
- Reads live in `features/<feature>/data.ts` (`import 'server-only'`, React `cache()`, zod-parsed DTOs, cache tags). `lib/strapi` is the transport and the only module that reads Strapi secrets.
- Server Components prefetch through the DAL into a per-request QueryClient and hand the state to the client with `HydrationBoundary`. Client Components use `useSuspenseQuery` with the same `queryOptions` factory, whose client `queryFn` calls the BFF.
- Lists are not cached (freshness). Categories and discussion detail reads use `'use cache'` with `cacheLife` and tags.

## Consequences

- Fast first HTML, instant client-side filtering, and no duplicated fetch logic.
- One rule to keep: never render the same data from an RSC and from a Query consumer.
- If Cache Components prove costly, `cacheComponents: false` is a one-line opt-out and the rest of the architecture is unchanged.
