# ADR-0004 — pnpm + Turborepo monorepo with config packages only

**Status:** Accepted · 2026-10-23

## Context

Two applications (Next.js and Strapi) must ship together, run together in development and be built in CI. Strapi 5 officially supports pnpm. Turborepo's reference layout is `apps/` plus `packages/` with shared TypeScript and ESLint configs.

## Decision

pnpm workspace with Turborepo. `apps/web`, `apps/cms`, `packages/typescript-config`, `packages/eslint-config`. No `packages/ui` and no `packages/schemas`: each would have exactly one consumer today. Strict Turbo env mode with every runtime variable declared per task.

## Consequences

- `pnpm dev` runs both apps; `turbo lint type-check test build` is cached locally and in CI.
- Promotion rule: when a second consumer appears (mobile app, worker), move `apps/web/src/lib/strapi/schemas.ts` to `packages/schemas`; optionally expose Strapi's generated types as `packages/strapi-types`.
- If Strapi fails to resolve a dependency under pnpm's isolated linker, `node-linker=hoisted` in `.npmrc` is the known fix.
