# Le Revenu Community

🇫🇷 [Version française](README.fr.md)

Community space for Le Revenu readers: ask a money question, share an experience, answer other members.

Full-stack developer technical test · Next.js 16 · Strapi 5 · PostgreSQL (or SQLite with nothing to install).

---

## Contents

1. [Run it](#1-run-it): [A. One command with Docker](#a-one-command-with-docker) · [B. Two minutes with Node](#b-two-minutes-with-node-sqlite-no-docker) · [C. Full development setup](#c-full-development-setup-docker--postgresql--mailbox)
2. [Log in and try it](#2-log-in-and-try-it)
3. [What the application does](#3-what-the-application-does)
4. [Architecture](#4-architecture)
5. [Security model](#5-security-model)
6. [API](#6-api)
7. [Tests](#7-tests)
8. [Quality and CI/CD](#8-quality-and-cicd)
9. [Deployment](#9-deployment)
10. [Repository layout](#10-repository-layout)
11. [Architecture decisions](#11-architecture-decisions)
12. [Troubleshooting](#12-troubleshooting)
13. [Evolutions](#13-evolutions)

## 1. Run it

Three ways, from the lightest to the fullest. Pick one; every path ends with the site on http://localhost:3000 and the demo data loaded.

| Path                       | You need                                       | Best for                                                     |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| A. One command with Docker | Docker Desktop (or Docker Engine + Compose v2) | Trying the project without installing Node                   |
| B. Two minutes with Node   | Node 24, pnpm 10                               | Reading the code and running it in development mode          |
| C. Full development setup  | Node 24, pnpm 10, Docker                       | Working on the project with PostgreSQL and the local mailbox |

### A. One command with Docker

```bash
git clone https://github.com/marwen-mrabti/le-revenu.git
cd le-revenu
docker compose --profile apps up --build
```

The first run builds two images and takes a few minutes. Expected at the end: four services reported `healthy`, then:

- http://localhost:3000 — the site, with 18 demo discussions.
- http://localhost:1337/admin — the Strapi admin; create the administrator account on first visit.
- http://localhost:8025 — the mailbox: every mail the site sends (sign-up confirmation, password reset) lands here.

No file to create: the Compose file carries demo values for every secret. They are public in this repository, so they are for a local run only; to use your own, copy `.env.example` to `.env` and set the same names there (section 3 of that file explains each one).

Inside the Docker network the apps talk through the service names (`STRAPI_URL=http://cms:1337`, `WEBHOOK_URL=http://web:3000`); mails, login callbacks and the browser keep `localhost`. Development stays on pnpm (paths B and C): Docker is the production shape, and the same images serve the deployment.

Stop with `Ctrl+C`; remove everything, database included, with `docker compose --profile apps down -v`.

### B. Two minutes with Node (SQLite, no Docker)

Prerequisites: Node 24 (`.nvmrc`) and pnpm 10 (`corepack enable` is enough, the version is pinned in `package.json`). No `.env` file to create in this mode.

1. Install.

   ```bash
   git clone https://github.com/marwen-mrabti/le-revenu.git
   cd le-revenu
   pnpm install
   ```

2. Start Strapi on the shipped SQLite database (terminal 1). Expected after a few seconds: `Strapi started successfully`, and http://localhost:1337/api/categories answers JSON.

   ```bash
   pnpm --filter cms dev:sqlite
   ```

3. Start Next.js (terminal 2). Expected: `Ready`, then http://localhost:3000/discussions shows the discussion list.

   ```bash
   pnpm --filter web dev
   ```

What happens: Strapi reads `apps/cms/.env.sqlite` (demo keys, never for production) and copies `apps/cms/database/demo.sqlite` into `.tmp/` on every start, so the committed file is never modified. Next.js has development defaults (`apps/web/src/config/env.ts`) matching that file. There is no mailer in this mode: sign-up needs no confirmation, the account is active at once, and password reset mails are discarded with a warning in the Strapi log.

### C. Full development setup (Docker + PostgreSQL + mailbox)

Prerequisites: Node 24, pnpm 10, Docker with Compose v2.

1. Environment files. Strapi refuses to start when a required variable is missing or still reads `change-me`.

   ```bash
   cp .env.example .env                       # PostgreSQL for docker-compose
   cp apps/cms/.env.example apps/cms/.env     # then replace every "change-me": openssl rand -base64 32
   cp apps/web/.env.example apps/web/.env     # optional; REVALIDATE_SECRET must match the cms side
   ```

2. Install and start the database and the mailbox. Expected: `docker compose ps` shows `lerevenu-db` and `lerevenu-mail` as `healthy`.

   ```bash
   pnpm install
   docker compose up -d db mailpit            # PostgreSQL 16 (lerevenu, lerevenu_test) and Mailpit
   ```

3. Start both applications. Expected: Strapi on http://localhost:1337, Next.js on http://localhost:3000.

   ```bash
   pnpm dev                                   # Turborepo starts cms and web
   ```

`WEB_URL` and `PUBLIC_URL` are the public addresses of the two apps: every mail link and every login callback is built from them, nothing is hard-coded. Strapi refuses to start without them.

On first boot Strapi creates the tables, the two locales (fr by default, en), the role permissions, the mail settings, then the demo data when `SEED_DEMO_DATA=true`. A second boot duplicates nothing.

**Mails.** Confirmation at sign-up and password reset go to Mailpit: open http://localhost:8025 to read them. `apps/cms/.env.example` already points `SMTP_HOST` at it. With `SMTP_HOST` empty, mails are discarded, sign-up needs no confirmation, and Strapi logs one warning at boot. For real inboxes, two recipes, no code change:

- **Gmail** (delivers to anyone, about 500 mails a day): turn on 2-Step Verification, create an app password at https://myaccount.google.com/apppasswords, then:

  ```bash
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=465
  SMTP_SECURE=true
  SMTP_USER=you@gmail.com
  SMTP_PASS=the16characterapppassword                 # no spaces
  EMAIL_FROM="Communauté Le Revenu <you@gmail.com>"     # Gmail rewrites any other sender to your address
  ```

- **Resend** (free): create an API key at https://resend.com/api-keys, then `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER=resend`, `SMTP_PASS=re_…`, `EMAIL_FROM="Communauté Le Revenu <onboarding@resend.dev>"`. Until a domain is verified in Resend, it only delivers to the address of the Resend account; other recipients are refused (the forgot-password handler then answers 502).

Any other SMTP relay (Brevo, Postmark) works the same way: five variables.

**Google login, optional.** Create a "Web" OAuth client in Google Cloud with the redirect URI `http://localhost:1337/api/connect/google/callback`, put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `apps/cms/.env` and `NEXT_PUBLIC_GOOGLE_LOGIN=true` in `apps/web/.env`, restart. Without these values the Google button is not shown.

## 2. Log in and try it

Every demo reader shares the password **`Password123!`**.

| Identifier                                            | Role                                |
| ----------------------------------------------------- | ----------------------------------- |
| `alice`, `bob`                                        | readers, used by the tests          |
| `LaRedaction`, `Vincent_ETF`, `PapyBoursier`, 15 more | authors of the mockup's discussions |

Email of each account: `<lowercase identifier>@demo.lerevenu.test`. You can also create your own account on `/register`; with a mailbox running (paths A and C), confirm the address from the mail, then log in. Or use Google when the Google credentials are set.

A five-minute tour:

1. `/discussions`: filter by space, sort, search, paginate; everything stays in the URL. Switch language and theme in the header.
2. Open a discussion: the replies, the "Auteur" chip on the author's own replies. Log in as `alice`, reply, edit then delete your reply.
3. "Publier" in the header: create a discussion (title of 10 characters at least, space, type). You land on its page; "Modifier · Supprimer" are yours.
4. Account menu → "Mon compte": display name, password, delete account. Log out, "Mot de passe oublié ?", read the mail at http://localhost:8025.
5. Try `/discussions/nope` for the 404 page, and `/dev/boom` (development only) for the 500 page.

## 3. What the application does

| Feature                                                               | Status                  |
| --------------------------------------------------------------------- | ----------------------- |
| Discussion list: filter by space, sort by date, search, pagination    | ✔ `/discussions`        |
| Discussion detail with its replies, clean URL by slug                 | ✔ `/discussions/<slug>` |
| Reply to a discussion, edit and delete own replies and discussions    | ✔ from the detail page  |
| Create a discussion (title ≥ 10 characters, content, space, type)     | ✔ `/discussions/new`    |
| Login, sign-up with email confirmation, Google, logout, account menu  | ✔ `/login`, `/register` |
| Forgot / reset password by mail                                       | ✔ `/forgot-password`    |
| Account page: display name, username, password, delete account        | ✔ `/account`            |
| First password for a Google account, set from the account page        | ✔ `/account`            |
| Google name and picture; Google login linked to a password account    | ✔                       |
| French and English interface, language menu, light / dark theme       | ✔                       |
| Custom 404 and 500 pages (header kept, search, spaces, incident code) | ✔                       |
| Docker Compose for the whole stack                                    | ✔ path A                |

Not done, by choice: "Utile" votes and best answer, public profile page (bonus items of the brief, listed in the evolutions). Detailed progress lives in [`docs/plans/`](docs/plans/README.md).

## 4. Architecture

```
Browser ──(JSON + httpOnly cookie)──► Next.js Route Handlers ──(Bearer JWT)──► Strapi ──► PostgreSQL / SQLite
   ▲                                     (BFF, zod validation)                    ▲
   └──────── HTML (Server Components) ◄──── data access layer ────────────────────┘
```

- **Strapi** is the single source of truth: schemas, validation, permissions, business rules.
- **Next.js** never talks to the database. Server Components read Strapi through a typed data access layer; Client Components go through Route Handlers (`/api/*`). No Server Actions.
- The discussion page is cached (`'use cache'`, hours) and tagged per collection and per entry; the reply and edit handlers expire the entry at once, and a Strapi webhook (`POST /api/revalidate`, registered at boot) expires it after an edit in the admin (ADR-0006).
- The Strapi JWT lives in an `httpOnly` cookie set by Next.js; it never reaches browser JavaScript and the Strapi URL is not exposed (one documented exception for the Google flow, ADR-0009).
- Diagrams and flows: [`docs/architecture.md`](docs/architecture.md). Data model: [`docs/data-model.md`](docs/data-model.md).

## 5. Security model

| Rule                                    | Where it is enforced                                                                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| No posting without authentication       | Public role has no `create` permission → **403**                                                                                          |
| No posting as someone else              | The controller drops any `author` sent and forces the session user                                                                        |
| Title ≥ 10 characters, content required | Strapi `schema.json`, enforced even when calling the API directly → **400**                                                               |
| Edit and delete reserved to the author  | `is-owner` policy on `update` and `delete` → **403**                                                                                      |
| Email never exposed                     | Population limited to `username`; no role has `user.find`                                                                                 |
| Draft & Publish off                     | Otherwise Strapi hides new entries and skips validation on drafts                                                                         |
| Session                                 | `lr_session` cookie, httpOnly, SameSite=Lax, 7 days, written by Next.js; the Strapi JWT appears in no response                            |
| BFF writes                              | JSON only (**415**) and same origin (`Sec-Fetch-Site` / `Origin`, **403**)                                                                |
| Google login                            | Strapi provider, enabled only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set; final exchange verified against `/api/users/me` |
| Email confirmation                      | Required when a mailer is set; login answers **403** `EMAIL_NOT_CONFIRMED` until the mailed link is used                                  |
| Forgot password                         | Always **200**, no account enumeration; one-time code, new password logs in; used code → **400** `INVALID_CODE`                           |
| Own account only                        | `is-self` policy on `PUT` / `DELETE /users/:id`: own id, `username` and `displayName` only; email, role, confirmed, blocked untouchable   |

Permissions are created by code at boot (`apps/cms/src/bootstrap/ensure-permissions.ts`), not by hand in the admin: a clone of the repository gives the same state. Session and Google flow: [ADR-0009](docs/adr/0009-session-cookie-and-google-login.md); mailer, confirmation, account and Google linking: [ADR-0010](docs/adr/0010-mailer-confirmation-google-linking.md).

## 6. API

Base: `http://localhost:1337/api`. Strapi format: `{ data, meta }`, errors `{ data: null, error: { status, name, message, details } }`.

| Method and path                               | Auth            | Role                                                     |
| --------------------------------------------- | --------------- | -------------------------------------------------------- |
| `GET /categories?locale=fr\|en`               | public          | spaces, in the requested language                        |
| `GET /discussions?filters…&sort…&pagination…` | public          | paginated list (10 by default, 50 max), `createdAt` sort |
| `GET /discussions/slug/:slug`                 | public          | detail with replies                                      |
| `POST /discussions`                           | Bearer          | create, author forced from the session                   |
| `PUT` / `DELETE /discussions/:documentId`     | Bearer + author | edit, delete (with its replies)                          |
| `POST /replies`                               | Bearer          | reply, author forced                                     |
| `PUT` / `DELETE /replies/:documentId`         | Bearer + author |                                                          |
| `POST /auth/local`                            | —               | login → `{ jwt, user }`                                  |
| `POST /auth/local/register`                   | —               | sign-up; pending until confirmed when a mailer is set    |
| `POST /auth/forgot-password`                  | —               | reset mail, always 200                                   |
| `POST /auth/reset-password`                   | —               | code + new password → `{ jwt, user }`                    |
| `POST /auth/send-email-confirmation`          | —               | resend the confirmation mail                             |
| `POST /auth/change-password`                  | Bearer          | current + new password → new `jwt`                       |
| `GET /auth/password-status`                   | Bearer          | `{ hasPassword }`                                        |
| `POST /auth/set-password`                     | Bearer          | first password of a Google account, 409 once set         |
| `GET /users/me`                               | Bearer          | current profile                                          |
| `PUT` / `DELETE /users/:id`                   | Bearer + self   | own `username` / `displayName`, own deletion             |

Example:

```bash
curl 'http://localhost:1337/api/discussions?filters[category][slug][$eq]=bourse&sort=createdAt:desc&pagination[pageSize]=5'
```

## 7. Tests

| Level                | Tool                                                     | Command                              |
| -------------------- | -------------------------------------------------------- | ------------------------------------ |
| Backend, integration | Vitest + supertest, Strapi on PostgreSQL `lerevenu_test` | `pnpm --filter cms test:integration` |
| Frontend, unit       | Vitest + Testing Library                                 | `pnpm --filter web test`             |
| End to end           | Playwright, `fr` and `en` projects                       | `pnpm --filter web test:e2e`         |

Playwright needs a browser: `pnpm --filter web exec playwright install chromium`, once. By default it builds then starts the application; with `E2E_BASE_URL=http://localhost:3000` it uses the development server already running. Strapi limits logins to 10 per minute per IP: do not log in by hand during a run.

The four tests required by the brief (discussion validation, unauthenticated post refused, author spoofing blocked, discussion listing) live in `apps/cms/tests/`, together with ownership, replies, login, bilingual categories, email confirmation, password reset, the own-account rules, the first password of a Google account, the stored mail templates and the revalidation webhook: 14 files, 56 tests, about 20 s.

How the backend tests run:

1. `tsc` compiles the application into `.tmp/test-dist` (never into `dist/`, so no conflict with a running `strapi develop`).
2. Vitest's `globalSetup` empties the `lerevenu_test` schema (refused unless the name ends with `_test`), starts **one Strapi** on port 1338 with `NODE_ENV=test`, lets the seed load the demo data, logs `alice` and `bob` in.
3. The files run one after the other and talk to that instance over HTTP (supertest): the same answers the frontend receives.

Prerequisites: PostgreSQL running (`docker compose up -d db` creates `lerevenu_test`), `apps/cms/.env` filled. `DATABASE_TEST_NAME` changes the test database name.

Frontend tests (`apps/web`, Vitest + Testing Library, colocated `*.test.ts(x)`, 141 tests): the Strapi client (query string, error envelope, unexpected answer, unreachable server), the filters schema and the URL ↔ state mapping (defaults, invalid page, `clearOnDefault`), the discussion card (the brief's five fields, link to the detail, no email or numeric id), pagination (current page, filters kept, bounds), the `GET /api/discussions` handler (422 on an unknown sort, locale passed, 503 without leaking Strapi's message), the session cookie and request guards, the auth, account, reply, discussion and revalidate handlers, the two mail-link landings (reader language), the login, sign-up, forgot, reset, profile, password, first-password and delete forms, the reply form and list, the create form, the owner actions, the cache tags, the verify-email page, the user menu, the islands (error → fallback → retry), the 500 page, the language menu and theme toggle, fr / en key parity.

End to end (`apps/web/e2e`, Playwright): login and session privacy, i18n, 404 / 500 pages, resilience (a 503 on the list leaves the page intact), the discussion detail (from the list, visitor call to action, alice replies, edits and deletes, 404), the create page (visitor redirect, rules, alice publishes, lands, listed, deletes), and the account lifecycle through Mailpit's API (sign-up → mail → confirm → login → profile → forgot → reset → delete). The account spec skips itself when Mailpit is not reachable, and needs Strapi to send through Mailpit (`SMTP_HOST=localhost`): with a real relay such as Resend's free tier, the test addresses are refused and the sign-up step fails.

## 8. Quality and CI/CD

- **Branches**: `main` (production, protected), `development` (integration, protected), `feature/<short-name>`. Every feature starts with a reviewed plan in `docs/plans/`.
- **Git hooks** (husky): Node 24 required, no commits on protected branches, lint-staged, commitlint (Conventional Commits), checks before push.
- **`pnpm verify`**: clean clone, frozen install, lint, format, commitlint, type-check, build, tests. Nothing red gets pushed.
- **GitHub Actions**: lint and format, type-check, unit tests, Strapi integration tests on a PostgreSQL service (`apps/cms/.env.ci`), build, both Docker images, on every PR to `development` and `main`.
- Details: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## 9. Deployment

Same images and variable names as Docker, nothing hard-coded (ADR-0011). Production is Next.js on **Vercel** and Strapi + PostgreSQL on **Railway**, both deploying `main` through their GitHub integration.

| Piece      | Where                                                             | Source of truth                                                                                                                    |
| ---------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Next.js    | Vercel, Root Directory `apps/web`, Node 24                        | `STRAPI_URL`, `NEXT_PUBLIC_STRAPI_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GOOGLE_LOGIN`, `REVALIDATE_SECRET`, `AUTH_COOKIE_NAME` |
| Strapi     | Railway service built from `apps/cms/Dockerfile` (`railway.json`) | `apps/cms/.env.example`, with `TRUST_PROXY=true`, `PUBLIC_URL`, `WEB_URL`, `WEBHOOK_URL`, `CORS_ORIGINS` on the public addresses   |
| PostgreSQL | Railway Postgres plugin, private network                          | `DATABASE_*` as references to the plugin, `DATABASE_SSL=false`                                                                     |
| Media      | Railway volume on `/app/public/uploads`                           |                                                                                                                                    |
| Mails      | Gmail SMTP (section 1.C recipe) or any relay                      | `SMTP_*`, `EMAIL_FROM`                                                                                                             |

`TRUST_PROXY=true` makes Strapi trust the proxy's `X-Forwarded-Proto`: without it, the Google login fails behind a TLS-terminating proxy with "Cannot send secure cookie over unencrypted connection". Keep it `false` for Docker Compose and development.

Order on a first deploy: Railway (gives the Strapi address), then Vercel (gives the site address), then set `WEB_URL`, `WEBHOOK_URL` and `CORS_ORIGINS` on Railway and redeploy once; add `https://<strapi>/api/connect/google/callback` to the Google OAuth client. The first visitor of `/admin` creates the administrator account. After every deploy:

```bash
./scripts/smoke.sh https://<site> https://<strapi>      # health, list, login, forgot-password, webhook guard
```

## 10. Repository layout

```
apps/cms/                       Strapi 5 (TypeScript)
  config/                       server, database (postgres | sqlite), plugins, middlewares; env/test/ for tests
  src/api/<type>/               category, discussion, reply: schema.json, controller, service, routes, constants
  src/api/discussion/utils/     slug.ts (server-made slug), presenter.ts (reduced author, no numeric id)
  src/policies/                 is-owner.ts (404 / 403 when the caller is not the author), is-self.ts (own user record only)
  src/extensions/users-permissions/  user fields displayName and avatarUrl, Google linking, is-self on the user routes
  src/bootstrap/                env check, indexes, locales, permissions, login providers, Google profile, mail settings, webhook
  src/emails/                   React Email templates (layout, confirmation, reset) rendered at boot
  src/seed/                     demo data, loaded once on an empty database
  tests/                        integration tests (one Strapi on :1338, lerevenu_test database)
  database/demo.sqlite          pre-filled database of the zero-setup mode

apps/web/                       Next.js 16 (App Router, Cache Components)
  src/app/[locale]/             pages: (forum)/discussions, discussions/[slug], discussions/new, (auth)/login, register, forgot-password, reset-password,
                                verify-email, account, auth/google/callback, not-found.tsx, error.tsx; loading.tsx per page
  src/app/api/                  Route Handlers (BFF): auth/*, account, discussions, replies, categories, revalidate (webhook)
  src/features/<domain>/        discussions, replies, categories, auth: schemas (zod), data (server access),
                                api (TanStack queries and mutations), components, hooks
  src/components/               ui/ (shadcn), form/ (text, password, textarea, select, radio cards), shared/ (islands, avatar, owner actions), layout/, theme/
  src/lib/                      strapi/ (typed client, only reader of STRAPI_URL), api/ (BFF client, errors,
                                guards), auth/ (session cookie), i18n/ (locale of a mail link), query/ (TanStack)
  src/i18n/                     routing, navigation, locale metadata
  messages/                     fr.json, en.json (same keys, checked by a test)
  e2e/                          Playwright

packages/eslint-config/         shared ESLint rules (base, next, strapi)
packages/typescript-config/     shared tsconfig
docs/                           architecture.md, data-model.md, adr/ (decisions), plans/ (one plan per branch),
                                mockups/ (HTML mockups reviewed before code)
.github/workflows/ci.yml        lint, format, type-check, unit tests, Strapi tests on PostgreSQL, build
apps/cms/Dockerfile · apps/web/Dockerfile · docker-compose.yml (db, mailpit, and cms + web behind the `apps` profile) · turbo.json · pnpm-workspace.yaml
```

## 11. Architecture decisions

Every structural decision is recorded as an ADR (Architecture Decision Record): [`docs/adr/`](docs/adr/README.md).

| ADR  | Decision                                                                                             |
| ---- | ---------------------------------------------------------------------------------------------------- |
| 0001 | Strapi Users & Permissions as the only identity provider; better-auth and Drizzle evaluated, dropped |
| 0002 | Route Handlers (BFF) rather than Server Actions                                                      |
| 0003 | Cache Components, data access layer, TanStack Query                                                  |
| 0004 | pnpm + Turborepo monorepo                                                                            |
| 0005 | zod DTOs as the frontend's type source                                                               |
| 0006 | Tag-based cache invalidation driven by a Strapi webhook                                              |
| 0007 | French and English from day one with next-intl                                                       |
| 0008 | Forum rules enforced in Strapi, documentId identifiers only, integration tests over HTTP             |
| 0009 | Session cookie set by Next.js, Google login through Strapi's provider                                |
| 0010 | Mailer, email confirmation, account page and Google account linking                                  |
| 0011 | Hosting: Next.js on Vercel, Strapi and PostgreSQL on Railway                                         |

## 12. Troubleshooting

| Symptom                                            | Cause and remedy                                                                                                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm install` rejects the Node version            | Node 24 required: `nvm use` (reads `.nvmrc`) or `mise use`                                                                                                                                       |
| `pnpm: command not found`                          | `corepack enable`, then retry                                                                                                                                                                    |
| `EADDRINUSE 1337` or `3000`                        | Another Strapi or Next is already running; never run two `strapi develop` in the same folder                                                                                                     |
| Strapi: `Environment check failed`                 | A variable is missing or still `change-me` in `apps/cms/.env`; the message lists them                                                                                                            |
| Next: `Invalid environment variables` (production) | `STRAPI_URL` and `REVALIDATE_SECRET` are required in production                                                                                                                                  |
| `connect ECONNREFUSED 5432`                        | Docker not started: `docker compose up -d db`, then `docker compose ps`                                                                                                                          |
| Login: "Too many attempts"                         | Strapi allows 10 logins per minute per IP; wait a minute                                                                                                                                         |
| Google: "access blocked"                           | Google app in testing mode: add your address in Google Auth Platform → Audience → Test users                                                                                                     |
| No confirmation or reset mail arrives              | Mailpit not started (`docker compose up -d mailpit`) or `SMTP_HOST` empty; read mails at http://localhost:8025. Mailpit never delivers to a real inbox: use Gmail or Resend for that (section 1) |
| Resend: `550 You can only send testing emails…`    | Free tier without a verified domain: only the Resend account's own address receives mail                                                                                                         |
| Login: "address not confirmed yet"                 | Click the link in the confirmation mail, or use "resend the link"; only the newest mail is valid                                                                                                 |
| Integration tests: `Refusing to reset`             | The target database does not end with `_test`; check `DATABASE_TEST_NAME`                                                                                                                        |

## 13. Evolutions

The mockup's tabs (Trending, For you, Unanswered), compact view, pinned topics, "Useful" and view counters, accent-insensitive search (`unaccent`), "Useful" votes and best answer, PostgreSQL full-text search, public reader profile, email change with confirmation, branded page for an expired confirmation link, typed OpenAPI generation from Strapi, `jwtManagement: 'refresh'`, a custom domain and Vercel preview deployments on a staging Strapi.

---

Development assistance tools, including AI, were used for research and speed; every line delivered is understood and defensible in review.
