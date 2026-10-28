# 09 — Deployment: Next.js on Vercel, Strapi + PostgreSQL on Railway

Branch: `feature/deployment` · Target: `development` · Estimate: 3 h · Status: approved

## 1. Goal

A public URL where a reviewer opens the site with the 18 demo discussions, signs up and receives the mail, logs in with Google, posts, and sees a cached page refresh after an edit in the Strapi admin. Same images and variable names as Docker (plan 08): nothing hard-coded, no secret in the repository. Brief: deployment bonus; ADR-0011.

## 2. Scope

**In:** Railway config as code, `TRUST_PROXY` for the TLS proxy, smoke script, README section, ADR, the two dashboards set up, the production run verified.
**Out:** custom domain (not needed for the cookies, costs money); Vercel preview deployments (one Strapi, one database); CI-driven deploys (the GitHub integrations of both providers deploy `main`); another mail relay (Gmail works; five variables to switch).

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
                   Railway service cms (apps/cms/Dockerfile) ──private network──▶ Railway Postgres
                      │ WEBHOOK_URL=<web> (x-revalidate-secret)        volume /app/public/uploads
                      ▼
                   Vercel /api/revalidate ─▶ revalidateTag
mails:  Strapi ──SMTP 465──▶ Gmail ──▶ reader; links built from WEB_URL
google: browser ─▶ <cms>/api/connect/google ─▶ Google ─▶ <cms>/api/connect/google/callback ─▶ <web>/auth/google/callback
```

## 5. Design

- `apps/cms/config/server.ts`: `proxy: { koa: env.bool('TRUST_PROXY', false), ipHeader: 'X-Forwarded-For', maxIpsCount: 1 }`. Strapi 5 reads `server.proxy.koa`; a bare boolean is ignored.
- `railway.json` at the repository root: Dockerfile builder with `apps/cms/Dockerfile` (the image builds from the root, like Compose and CI), healthcheck `/_health` with a 180 s budget (the first boot seeds the demo data), restart on failure, watch paths `apps/cms/**`, `pnpm-lock.yaml`.
- Vercel: Root Directory `apps/web`, framework Next.js, pnpm from `packageManager`; no `vercel.json` unless the first deploy needs one.
- Variables, Railway `cms`: `HOST=0.0.0.0`, `PORT=1337`, `NODE_ENV=production`, `TRUST_PROXY=true`, `PUBLIC_URL`, `WEB_URL`, `WEBHOOK_URL` (= `WEB_URL`), `CORS_ORIGINS`, `DATABASE_CLIENT=postgres`, `DATABASE_HOST/PORT/NAME/USERNAME/PASSWORD` as references to the Postgres plugin, `DATABASE_SSL=false`, the seven secrets (`APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`, `REVALIDATE_SECRET`), `SEED_DEMO_DATA=true` (idempotent), `SMTP_*` and `EMAIL_FROM` (Gmail), `GOOGLE_CLIENT_ID/SECRET`.
- Variables, Vercel: `STRAPI_URL`, `NEXT_PUBLIC_STRAPI_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GOOGLE_LOGIN=true`, `REVALIDATE_SECRET` (same value), `AUTH_COOKIE_NAME=lr_session`.
- Order: Railway first (gives the cms domain), Vercel second (gives the web domain), then `WEB_URL`, `WEBHOOK_URL`, `CORS_ORIGINS` on Railway and one redeploy. Google Cloud: add `https://<cms>/api/connect/google/callback`.
- Secrets are generated locally (`openssl rand -base64 32`) into a file outside the repository and pasted into the dashboards; never in a commit, a log or a chat.

## 6. Phases and steps

### Phase A — Code and docs (1 h)

1. `TRUST_PROXY` in `config/server.ts`, `.env.example`, test.
2. `railway.json`, `scripts/smoke.sh`.
3. README EN + FR "Deployment" section, ADR-0011, this plan, tracker.
   Exit: `pnpm verify` green, Docker stack unchanged.

### Phase B — Accounts and variables (1 h, user + assistant)

1. User: Railway account, project `le-revenu`, GitHub repo connected on `main`, Postgres plugin, Hobby plan or trial credit.
2. Assistant: service settings (root `/`, config `railway.json`), variables, volume; first deploy; cms domain.
3. Assistant (user's Vercel CLI login): `vercel link`, variables, production deploy; web domain.
4. Both: `WEB_URL`/`WEBHOOK_URL`/`CORS_ORIGINS` on Railway, redeploy; Google redirect URI.
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
- [ ] Railway logs: `Strapi started successfully`, no warning about mails.

## 9. Risks and open questions

| Risk or question                                            | Mitigation or decision needed                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Strapi image 730 MB, about 500 MB RAM at run time           | Fits Railway Hobby; healthcheck budget 180 s for the first boot                |
| Trial credit runs out and the service stops silently        | Hobby plan ($5/month credit included)                                          |
| Gmail app password tied to one mailbox, about 500 mails/day | Enough for a demo; another relay later, five variables                         |
| Vercel build fails on env validation                        | Variables missing, no code change; `SKIP_ENV_VALIDATION` stays for Docker only |
| Google refuses the callback                                 | Redirect URI must be exactly `https://<cms>/api/connect/google/callback`       |

## 10. Definition of done

- [ ] All acceptance criteria met
- [ ] Tests in section 7 green locally and in CI
- [ ] Manual checklist done
- [ ] Docs updated (README, ADR, this plan's status)
- [ ] PR opened against `development` with the two URLs
