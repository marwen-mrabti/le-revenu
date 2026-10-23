# Contributing

## Git flow

- `main` — production. Receives release and hotfix merges only, each tagged `vX.Y.Z`.
- `develop` — integration, always green. Base for feature branches.
- `feature/<scope>-<short-desc>` — one change, PR into `develop`, squash merge with a conventional title.
- `release/X.Y.Z` — cut from `develop`, version bump and changelog, PR into `main` (merge commit + tag), back-merged into `develop`.
- `hotfix/<short-desc>` — from `main`, PR into `main`, patch tag, back-merged into `develop`.

## Commits

Conventional Commits, one or two lines, imperative mood, no tool attribution.

```
feat(cms): force author from session on discussion create
fix(web): keep category filter when changing sort
```

Types: `feat fix refactor chore test docs ci style perf build revert`. Scopes: `web cms docker ci docs deps repo`.
Enforced by commitlint (husky `commit-msg`).

## Engineering rules

- Pagination always comes from the backend; the UI never slices arrays.
- Every endpoint is secured by default: Strapi permissions and policies, zod on every BFF input, cookie check on every write.
- Every page has a `loading.tsx` skeleton matching its layout and an `error.tsx` boundary.
- Pages are composition only (target 80 lines, hard stop 120). Components ≤ 150 lines, hooks and handlers ≤ 100.
- Components are small and self-managed: one typed DTO in, or they own their query. Minimal prop drilling: `children`, Query cache, URL state, context only for theme and current user.
- Server Components by default; `'use client'` only at the interactive leaf.
- Validate at every boundary with zod. No `any`.
- Tests live next to the code. Every PR adds or updates tests.
- Small PRs, each green on CI.

## Local checks

```bash
pnpm lint          # eslint
pnpm format:check  # prettier
pnpm type-check    # tsc
pnpm test          # vitest
```

Hooks: `pre-commit` runs lint-staged, `commit-msg` runs commitlint, `pre-push` runs type-check and tests for packages changed since `develop`.
