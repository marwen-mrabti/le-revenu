# ADR-0011 — Hosting: Next.js on Vercel, Strapi and PostgreSQL on Railway

**Status:** Accepted · 2026-10-28

## Context

The brief asks for a project that runs from a clone; a public URL lets a reviewer try it without installing anything. Plan 08 produced two production images and a Compose profile. The hosting had to reuse them, cost close to nothing, stay up without a cold start, and keep every address in the environment (ADR-0006, ADR-0009 and ADR-0010 build mail links, callbacks and the webhook from `WEB_URL`, `PUBLIC_URL`, `WEBHOOK_URL`). No domain is bought.

## Decision

- **Next.js on Vercel** (Hobby): Root Directory `apps/web`, Node 24, production deploys from `main` through the GitHub integration, previews off (one Strapi, one database: a preview would write production data). Env: `STRAPI_URL`, `NEXT_PUBLIC_STRAPI_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GOOGLE_LOGIN`, `REVALIDATE_SECRET`, `AUTH_COOKIE_NAME`.
- **Strapi on Railway** from `apps/cms/Dockerfile` (`railway.json` at the repository root: Dockerfile builder, `/_health` healthcheck, restart on failure, watch paths limited to the cms), **PostgreSQL** as a Railway plugin on the private network (`DATABASE_SSL=false`), a small volume on `/app/public/uploads` for admin media. Region: EU west.
- **Provider subdomains.** The session cookie is set by Next.js on its own domain (`HttpOnly`, `SameSite=Lax`, `Secure` in production, ADR-0009), and the browser never calls Strapi with it: the two apps do not need a shared site. Strapi's Google dance keeps its own cookie on the Railway domain through top-level redirects.
- **`TRUST_PROXY`**: Railway terminates TLS in front of the container, so `server.proxy.koa` is set from this variable (`ipHeader: X-Forwarded-For`, `maxIpsCount: 1`). Without it Koa believes the request is plain http and refuses the secure cookie of the Google flow ("Cannot send secure cookie over unencrypted connection"). Off in Docker Compose and development.
- **Mail**: Gmail SMTP with an app password (README recipe); any other relay is five variables.
- **Smoke test** `scripts/smoke.sh <web> <cms>` after every deploy: health, list with demo data, login, forgot-password, webhook guarded.

Rejected: Strapi Cloud (free plan being removed, paid from about $35/month); Render free tier (service sleeps, free PostgreSQL deleted after 30 days); a bought domain (not needed for the cookies, costs money).

## Consequences

- Vercel is free; Railway costs about $5 to $8 a month (the Hobby credit covers most of it, the trial credit covers the start).
- Deploy = merge into `main`: Vercel builds the web app, Railway rebuilds the Strapi image when `apps/cms/**` changes. Secrets live only in the two dashboards; the repository holds names and placeholders.
- Changing a host means changing `WEB_URL`, `WEBHOOK_URL`, `PUBLIC_URL`, `CORS_ORIGINS` on Railway and the three public URLs on Vercel, plus the Google redirect URI. No code.
- The Strapi admin account is created by the first visitor of `/admin`: do it right after the first deploy.
