# 08 — Docker Compose for the three services

Branch: `feature/docker` · Target: `development` · Estimate: 2 h · Status: done (2026-10-28)

## 1. Goal

`docker compose up` starts PostgreSQL, Mailpit, Strapi and Next.js together, from the repository, with the demo data seeded on first boot: the brief's bonus "Docker Compose pour Next.js, Strapi et PostgreSQL". The same images serve the deployment (Railway builds from a Dockerfile).

## 2. Scope

**In**

- `apps/cms/Dockerfile`: multi-stage, pnpm workspace install filtered on `cms`, `strapi build`, production image on `node:24-alpine`, `strapi start`, healthcheck on `/_health`.
- `apps/web/Dockerfile`: multi-stage, `next build` (standalone output already on), production image with the standalone server, healthcheck on `/discussions`.
- `docker-compose.yml`: services `db`, `mailpit`, `cms` (depends on `db` healthy), `web` (depends on `cms` healthy); demo values for every secret in the compose file itself, overridable from the root `.env`, so the stack runs with no file to create; in-network overrides (`DATABASE_HOST=db`, `SMTP_HOST=mailpit`, `STRAPI_URL=http://cms:1337`, `WEB_URL=http://web:3000` for the webhook, `PUBLIC_URL=http://localhost:1337` for the browser). Profile `apps`: `docker compose up -d db mailpit` keeps working for the pnpm workflow; `docker compose --profile apps up` adds the two apps.
- `.dockerignore` files, README EN + FR section "Everything in Docker", CI job building both images (no push) so a broken Dockerfile fails the PR.
- The pending items ride along: the Gmail README recipe commit, the e2e skip of the dev-only crash page against a production build.

**Out**

- Publishing images to a registry: the deployment platform builds them.
- Hot reload inside Docker: development stays on pnpm; Docker is the production shape.

## 3. Acceptance criteria

1. From a fresh clone with no `.env` file, `docker compose --profile apps up --build` ends with four healthy services; http://localhost:3000/discussions lists the seeded discussions; http://localhost:1337/admin answers.
2. Sign-up inside Docker sends the mail to Mailpit (http://localhost:8025); the link lands on the web app; login works.
3. A discussion edited in the admin refreshes on the web app (the webhook reaches `web:3000`).
4. `docker compose up -d db mailpit` alone still works for the pnpm workflow; `pnpm verify` green; the CI image build job green.
5. Image sizes reported (Strapi about 730 MB with its admin build, sharp and the SQLite driver; Next about 220 MB); no secret baked in (build args only for public values).

## 4. Mockups

No UI. Service layout:

```
browser ──► web:3000 (Next, standalone) ──► cms:1337 (Strapi) ──► db:5432 (PostgreSQL 16)
               ▲                                │  └──► mailpit:1025 (SMTP) / :8025 (UI)
               └──── webhook POST /api/revalidate ┘
```

## 5. Design

- Two Dockerfiles at the app level, built with the repository root as context (pnpm workspace): `--frozen-lockfile` install of the filtered workspace, build, then a production image with production dependencies only.
- Next standalone: `output: 'standalone'` with `outputFileTracingRoot` already set to the repo root; the image copies `.next/standalone`, `.next/static` and `public`.
- Strapi: `strapi build` for the admin, then `strapi start` with `NODE_ENV=production`; the uploads folder is a named volume.
- Browser-facing URLs differ from in-network ones: `NEXT_PUBLIC_STRAPI_URL` and `PUBLIC_URL` stay `localhost`, `STRAPI_URL` and `WEB_URL` use service names. Documented in the compose file and the README.

## 6. Phases and steps

### Phase A — Images (1 h)

1. `.dockerignore`, `apps/cms/Dockerfile`, `apps/web/Dockerfile`, local `docker build` of both.
   Exit: both images build and start alone.

### Phase B — Compose, CI, docs (1 h)

2. Compose services with profile `apps`, healthchecks, env overrides; CI job `docker-build`.
3. README EN + FR, plan done, tracker.
   Exit: criteria 1 to 5.

## 7. Tests

| Kind   | File                                          | Covers criterion |
| ------ | --------------------------------------------- | ---------------- |
| CI     | `.github/workflows/ci.yml` job `docker-build` | 4                |
| manual | section 8                                     | 1, 2, 3, 5       |

## 8. Manual verification

- Fresh clone, `.env` files from the examples, `docker compose --profile apps up --build`; list, detail, sign-up with Mailpit, admin edit → webhook → page refreshed.
- `docker images` sizes; `docker compose down -v` leaves nothing behind.

## 9. Risks and open questions

- Strapi's admin build is memory-hungry: the build stage may need `NODE_OPTIONS=--max-old-space-size=2048`.
- Next's standalone server must receive `HOSTNAME=0.0.0.0` to listen inside the container.

## 10. Definition of done

Criteria 1–5 green, plan status `done`, tracker updated, PR description written, `pnpm verify` green on a clean clone.
