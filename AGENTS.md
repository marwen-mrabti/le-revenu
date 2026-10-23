# Working in this repository

Read `CONTRIBUTING.md` first. The rules below are the short version and apply to every contributor and every coding agent.

## Stack

- `apps/web`: Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui (Base UI), TanStack Query + Form, zod, nuqs. No Server Actions: mutations go through Route Handlers under `src/app/api`.
- `apps/cms`: Strapi 5, TypeScript, PostgreSQL, Users & Permissions. Single source of truth for data, validation and permissions.
- Shared config in `packages/typescript-config` and `packages/eslint-config`.

## Process

- Branches: `main` (production, protected) and `development` (integration, protected). Work on `feature/`, `fix/`, `chore/` or `refactor/<short-name>` cut from `development`.
- Every branch starts with a reviewed plan in `docs/plans/` built from the template. No code before approval.
- Conventional commits, one or two lines, no tool attribution.
- Before pushing: `pnpm lint`, `pnpm format:check`, `pnpm type-check`, `pnpm build`. Never push red.

## Code rules

- Pagination from the backend only. Every endpoint secured by default. zod on every boundary. No `any`.
- Every page: `loading.tsx` skeleton, `error.tsx`, `generateMetadata`. Pages are composition only (≤ 120 lines).
- Small self-managed components, minimal prop drilling, Server Components by default.
- Secrets only in `config/env.ts` (web) and `lib/strapi/base.ts`; validated at startup.
- Tests next to the code; every PR adds or updates tests.

## Commands

```
pnpm dev            # both apps
pnpm lint | format:check | type-check | test | build
docker compose up -d db
```
