# ADR-0011 — Hosting: Next.js on Vercel, Strapi on Render, PostgreSQL on Neon

**Status:** Accepted · 2026-10-28 (revised the same day: Railway replaced by Render + Neon)

## Context

The brief asks for a project that runs from a clone; a public URL lets a reviewer try it without installing anything. Plan 08 produced two production images and a Compose profile. The hosting had to reuse them, cost nothing (no card, decided by the owner), stay reachable, and keep every address in the environment (ADR-0006, ADR-0009 and ADR-0010 build mail links, callbacks and the webhook from `WEB_URL`, `PUBLIC_URL`, `WEBHOOK_URL`). No domain is bought.

Railway was the first choice (Dockerfile as is, Postgres in the same network, always on) and was prepared; the account's trial had already expired and the Hobby plan costs $5 a month, so it was dropped. Strapi Cloud is removing its free plan. The Strapi image was measured at about 180 MB of memory at run time under a 512 MB cap, which fits a free instance.

## Decision

- **Next.js on Vercel** (Hobby): Root Directory `apps/web`, Node 24, production deploys from `main` through the GitHub integration, previews off (one Strapi, one database: a preview would write production data). Env: `STRAPI_URL`, `NEXT_PUBLIC_STRAPI_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GOOGLE_LOGIN`, `REVALIDATE_SECRET`, `AUTH_COOKIE_NAME`.
- **Strapi on Render**, free plan (0.1 CPU, 512 MB), Frankfurt, as an **image service**: CI builds `apps/cms/Dockerfile` on every merge to `main`, pushes `ghcr.io/marwen-mrabti/le-revenu-cms:latest` (public package), then calls Render's deploy hook (`RENDER_DEPLOY_HOOK` secret). The image is the one tested in CI; Render's build minutes are not used. `render.yaml` describes the service (Blueprint) with `sync: false` for every secret.
- **PostgreSQL on Neon**, free project (0.5 GB, scales to zero after 5 idle minutes, no expiry), `DATABASE_URL` with `sslmode=require` and `DATABASE_SSL=true`. Render's own free database is deleted 30 days after creation.
- **Keep-alive**: a free Render service sleeps after 15 idle minutes and takes about a minute to wake. A scheduled GitHub Actions workflow pings `/_health` every 10 minutes (repository variable `CMS_URL`); a month of uptime fits the 750 free hours.
- **Provider subdomains.** The session cookie is set by Next.js on its own domain (`HttpOnly`, `SameSite=Lax`, `Secure` in production, ADR-0009), and the browser never calls Strapi with it: the two apps do not need a shared site. Strapi's Google dance keeps its own cookie on the Render domain through top-level redirects.
- **`TRUST_PROXY`**: Render terminates TLS in front of the container, so `server.proxy.koa` is set from this variable (`ipHeader: X-Forwarded-For`, `maxIpsCount: 1`). Without it Koa believes the request is plain http and refuses the secure cookie of the Google flow ("Cannot send secure cookie over unencrypted connection"). Off in Docker Compose and development.
- **Mail**: Gmail SMTP with an app password (README recipe); any other relay is five variables.
- **Smoke test** `scripts/smoke.sh <web> <cms>` after every deploy: health, list with demo data, login, forgot-password, webhook guarded.

## Consequences

- Everything is free. The trade-offs are Render's: 0.1 CPU (boot about one minute), ephemeral filesystem (admin uploads lost on deploy; the site uploads nothing), sleep without the keep-alive ping.
- Deploy = merge into `main`: Vercel builds the web app, CI publishes the Strapi image and Render pulls it. Secrets live only in the two dashboards and the GitHub secret; the repository holds names and placeholders.
- Changing a host means changing `WEB_URL`, `WEBHOOK_URL`, `PUBLIC_URL`, `CORS_ORIGINS` on Render and the three public URLs on Vercel, plus the Google redirect URI. No code.
- The Strapi admin account is created by the first visitor of `/admin`: do it right after the first deploy.
- Paid upgrade path, if ever: Render Starter ($7/month) removes the sleep and the CPU cap, nothing else changes.
