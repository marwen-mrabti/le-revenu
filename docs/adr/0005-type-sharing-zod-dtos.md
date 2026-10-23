# ADR-0005 — zod DTOs as the frontend's type source

**Status:** Accepted · 2026-10-23

## Context

Strapi generates `types/generated/contentTypes.d.ts` for its own use. Those types describe every attribute and relation, not the shape of a given populate, and would require `@strapi/types` in the frontend. Strapi 5.48+ can also emit an OpenAPI document, still marked experimental.

## Decision

The frontend defines zod schemas for the DTOs it actually receives (the forced populate shapes) and derives its TypeScript types with `z.infer`. Strapi responses are parsed at the boundary, so a backend change fails loudly in one place. Strapi's generated types stay committed in `apps/cms` for the Document Service typing.

## Consequences

- Runtime validation and static types from one declaration.
- Evolution path: enable Strapi's `/api/openapi.json` and generate a client with `openapi-typescript`, keeping zod for request validation.
