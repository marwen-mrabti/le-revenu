# 09 — Deployment: Next.js on Vercel, Strapi on Render, PostgreSQL on Neon

Branch: `feature/deployment`, then `feature/render-deploy` · Target: `development` · Estimate: 3 h · Status: Phase A done (code, config, docs); Phases B and C (accounts, production run) parked on 2026-10-28, to resume with the two local files described in Phase B

## 1. Goal

A public URL where a reviewer opens the site with the 18 demo discussions, signs up and receives the mail, logs in with Google, posts, and sees a cached page refresh after an edit in the Strapi admin. Same images and variable names as Docker (plan 08): nothing hard-coded, no secret in the repository. Brief: deployment bonus; ADR-0011.

## 2. Scope

**In:** CI publishing the Strapi image to GitHub's registry, `render.yaml` Blueprint, keep-alive workflow, `TRUST_PROXY` for the TLS proxy, smoke script, README section, ADR, the dashboards set up, the production run verified.
**Out:** custom domain (not needed for the cookies, costs money); Vercel preview deployments (one Strapi, one database); a paid plan anywhere (owner's decision: nothing paid; Railway was prepared first and dropped when its trial turned out expired); another mail relay (Gmail works; five variables to switch).

## 3. Acceptance criteria

1. `https://<web>` answers `/discussions` with the demo data; `https://<cms>/_health` is 204 and `/admin` opens.
2. Sign-up sends the confirmation mail to a real inbox; the link lands on the login page in the reader's language.
3. Login, reply, edit, delete, create a discussion work on the public site; the session cookie is `Secure`.
4. Google login works end to end on the public site (production redirect URI).
5. An edit in the Strapi admin refreshes the cached discussion page through the webhook.
6. Forgot password: the mail arrives, the link opens the reset page, the new password logs in.
7. `scripts/smoke.sh <web> <cms>` is green after each deploy.
8. Docker Compose and the development modes are unchanged (`TRUST_PROXY` off).

## 4. Mockups

### UI features

None: no screen changes.

### Backend features

No entity or API change. Hosting map:

```
browser ──https──▶ Vercel (Next.js, apps/web)            cookie lr_session on <web>.vercel.app
                      │ STRAPI_URL (server side)
                      ▼
                   Render web service le-revenu-cms (free, Frankfurt) ──TLS──▶ Neon Postgres (free)
                      │ image ghcr.io/marwen-mrabti/le-revenu-cms, pushed by CI on main, deploy hook
                      │ WEBHOOK_URL=<web> (x-revalidate-secret)
                      ▼
                   Vercel /api/revalidate ─▶ revalidateTag
keep-alive: GitHub Actions ──every 10 min──▶ <cms>/_health
mails:  Strapi ──SMTP 465──▶ Gmail ──▶ reader; links built from WEB_URL
google: browser ─▶ <cms>/api/connect/google ─▶ Google ─▶ <cms>/api/connect/google/callback ─▶ <web>/auth/google/callback
```

## 5. Design

- `apps/cms/config/server.ts`: `proxy: { koa: env.bool('TRUST_PROXY', false), ipHeader: 'X-Forwarded-For', maxIpsCount: 1 }`. Strapi 5 reads `server.proxy.koa`; a bare boolean is ignored.
- CI (`docker-build` job): on a push to `main`, logs in to `ghcr.io`, pushes `le-revenu-cms:latest` and `:<sha>`, calls the Render deploy hook when the `RENDER_DEPLOY_HOOK` secret exists. PRs still build without pushing. The package is public (one click in GitHub after the first push), so Render needs no registry credential.
- `render.yaml`: web service `le-revenu-cms`, `runtime: image`, free plan, Frankfurt, `healthCheckPath: /_health`, literal values for the non-secret variables, `sync: false` for secrets and addresses, `generateValue` for the five Strapi salts. Creating the service through the API uses the same values.
- `.github/workflows/keep-alive.yml`: cron every 10 minutes, `curl <CMS_URL>/_health`, no-op without the repository variable.
- Neon: `DATABASE_URL` with `sslmode=require`, `DATABASE_SSL=true`; `config/database.ts` already passes a connection string and an SSL object.
- Vercel: Root Directory `apps/web`, framework Next.js, pnpm from `packageManager`; no `vercel.json` unless the first deploy needs one.
- Variables, Render `le-revenu-cms`: `HOST=0.0.0.0`, `PORT=1337`, `NODE_ENV=production`, `TRUST_PROXY=true`, `PUBLIC_URL`, `WEB_URL`, `WEBHOOK_URL` (= `WEB_URL`), `CORS_ORIGINS`, `DATABASE_CLIENT=postgres`, `DATABASE_URL` (Neon), `DATABASE_SSL=true`, the seven secrets (`APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`, `REVALIDATE_SECRET`), `SEED_DEMO_DATA=true` (idempotent), `SMTP_*` and `EMAIL_FROM` (Gmail), `GOOGLE_CLIENT_ID/SECRET`.
- Variables, Vercel: `STRAPI_URL`, `NEXT_PUBLIC_STRAPI_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GOOGLE_LOGIN=true`, `REVALIDATE_SECRET` (same value), `AUTH_COOKIE_NAME=lr_session`.
- Order: merge to `main` (CI publishes the image), Render first (gives the cms domain), Vercel second (gives the web domain), then `WEB_URL`, `WEBHOOK_URL`, `CORS_ORIGINS` on Render and one redeploy. Google Cloud: add `https://<cms>/api/connect/google/callback`.
- Secrets are generated locally (`openssl rand -base64 32`) into a file outside the repository and pasted into the dashboards; never in a commit, a log or a chat.

## 6. Phases and steps

### Phase A — Code and docs (1 h)

1. `TRUST_PROXY` in `config/server.ts`, `.env.example`, test.
2. CI image push, `render.yaml`, keep-alive workflow, `scripts/smoke.sh`.
3. README EN + FR "Deployment" section, ADR-0011, this plan, tracker.
   Exit: `pnpm verify` green, Docker stack unchanged.

### Phase B — Accounts and variables (1 h, user + assistant)

1. User: Render account (free), API key in a local file; Neon account (free), project `le-revenu` in Frankfurt, connection string in a local file; make the GitHub package `le-revenu-cms` public after the first CI push.
2. Assistant: Render service created through the API from the `render.yaml` values, variables set, first deploy, cms domain; `RENDER_DEPLOY_HOOK` secret and `CMS_URL` variable on the repository.
3. Assistant (user's Vercel CLI login): `vercel link`, variables, production deploy; web domain.
4. Both: `WEB_URL`/`WEBHOOK_URL`/`CORS_ORIGINS` on Render, redeploy; Google redirect URI.
   Exit: `scripts/smoke.sh` green.

### Phase C — Verification and hand-over (1 h)

1. Browser scenario (criteria 2 to 6), Google login by the user.
2. Admin account created by the user on `/admin`.
3. README "Live demo" URLs, tracker 30 green, HANDOFF.
   Exit: a stranger opens the URL and finds the five-minute tour working.

## 7. Tests

| Kind       | File                                   | Covers criterion |
| ---------- | -------------------------------------- | ---------------- |
| unit (cms) | `apps/cms/tests/server-config.test.ts` | #8               |
| smoke      | `scripts/smoke.sh`                     | #1, #3, #6, #7   |
| manual     | section 8                              | #2, #4, #5       |

## 8. Manual verification

- [ ] Public list, detail, create, account pages in both languages, dark mode, mobile width.
- [ ] Cookie `lr_session` shows `Secure; HttpOnly; SameSite=Lax` in the browser's storage panel.
- [ ] Sign-up mail received, confirmation lands on `/login?confirmed=1` in the right language.
- [ ] Google login on the public site.
- [ ] Edit a title in `/admin`, reload the discussion page: new title.
- [ ] Forgot password mail, reset, login with the new password.
- [ ] Render logs: `Strapi started successfully`, no warning about mails.

## 9. Risks and open questions

| Risk or question                                            | Mitigation or decision needed                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Strapi on 0.1 CPU and 512 MB                                | Measured 180 MB at run time under a 512 MB cap; boot about one minute; keep-alive ping |
| Free service sleeps after 15 idle minutes                   | GitHub Actions ping every 10 minutes; 744 h a month fits the 750 free hours            |
| Render's filesystem is ephemeral                            | The site uploads nothing; admin media would be lost on deploy, documented              |
| Gmail app password tied to one mailbox, about 500 mails/day | Enough for a demo; another relay later, five variables                                 |
| Vercel build fails on env validation                        | Variables missing, no code change; `SKIP_ENV_VALIDATION` stays for Docker only         |
| Google refuses the callback                                 | Redirect URI must be exactly `https://<cms>/api/connect/google/callback`               |

## 10. Definition of done

- [ ] All acceptance criteria met
- [ ] Tests in section 7 green locally and in CI
- [ ] Manual checklist done
- [ ] Docs updated (README, ADR, this plan's status)
- [ ] PR opened against `development` with the two URLs
