# Contributing

## Branches

- `main` — production. Protected. Only receives merges from `development`, through a pull request opened and merged by the maintainer. Each merge is tagged `vX.Y.Z`.
- `development` — integration, always green. Protected. Every work branch starts here and comes back here through a pull request.
- Work branches: `feature/<short-name>`, short and descriptive, for example `feature/discussion-list`. Only features get a branch. Smaller work (cleanup, docs, config, dependency bumps) rides in the next feature branch, or is agreed with the maintainer first. `fix/<short-name>` is reserved for bugs found after a release.

The husky hooks refuse commits and pushes made directly on `main` or `development`. The same rule is enforced on GitHub with branch protection.

## Flow

1. `git checkout development && git pull`
2. `git checkout -b feature/short-name`
3. Write the feature plan in `docs/plans/NN-short-name.md` from `docs/plans/TEMPLATE.md` (goal, scope, acceptance criteria, mockups, design, phased steps, tests). It is the first commit of the branch and must be reviewed before any code is written.
4. Commit small. Before pushing, run `pnpm verify`: it clones the branch into a temp folder, installs with a frozen lockfile and runs lint, format check, commitlint, type-check, build and tests exactly as CI does. Nothing red gets pushed.
5. Push the branch, open a PR into `development`.
6. CI must be green. Squash merge with a conventional title.
7. When `development` is ready for a release, the maintainer opens a PR `development → main`, merges it and tags.

Dependencies are updated by hand in `chore/deps` branches. No bots open pull requests on this repository.

## Commits

Conventional Commits, one or two lines, imperative mood, no tool attribution.

```
feat(cms): force author from session on discussion create
fix(web): keep category filter when changing sort
```

Types: `feat fix refactor chore test docs ci style perf build revert`. Scopes: `web cms docker ci docs deps repo`.
Enforced by commitlint (`commit-msg` hook).

## Engineering rules

- Pagination always comes from the backend; the UI never slices arrays.
- Every endpoint is secured by default: Strapi permissions and policies, zod on every BFF input, cookie check on every write.
- Every page has a `loading.tsx` skeleton matching its layout and an `error.tsx` boundary.
- Pages are composition only (target 80 lines, hard stop 120). Components ≤ 150 lines, hooks and handlers ≤ 100.
- Components are small and self-managed: one typed DTO in, or they own their query. Minimal prop drilling: `children`, Query cache, URL state, context only for theme and current user.
- Server Components by default; `'use client'` only at the interactive leaf.
- Validate at every boundary with zod. No `any`.
- Write handlers accept JSON only and reject cross-origin requests; security headers are set in `next.config.ts`.
- Required env is validated at startup on both apps; a missing or placeholder secret fails the boot.
- Every page defines `generateMetadata` (French title and description, Open Graph, canonical); `robots.ts` and `sitemap.ts` exist.
- Tests live next to the code. Every PR adds or updates tests.
- Small PRs, each green on CI.

## Local checks

```bash
pnpm lint          # eslint (apps + root)
pnpm format:check  # prettier
pnpm type-check    # tsc
pnpm test          # vitest
```

Hooks: `pre-commit` checks Node, blocks protected branches and runs lint-staged; `commit-msg` runs commitlint; `pre-push` blocks protected branches and runs lint, type-check and tests for packages changed since `development`.
