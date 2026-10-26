# ADR-0009 — Session cookie set by Next.js, Google login through Strapi's provider

**Status:** Accepted · 2026-10-26

## Context

ADR-0001 made Strapi Users & Permissions the only identity store and promised that the browser never sees the Strapi JWT. Branch 04 adds sign-up, login, logout and Google login. Strapi 5.59 changed its OAuth flow: the provider's answer is kept in Strapi's own server session (a `koa.sess` cookie on the Strapi origin) and `GET /api/auth/<provider>/callback` only works for the browser that holds that session. The old `?access_token=` query flow is gone.

## Decision

- **Session = httpOnly cookie, written by the BFF.** `POST /api/auth/login` and `/register` call Strapi, keep the JWT server-side, and answer `Set-Cookie: lr_session=…; HttpOnly; SameSite=Lax; Path=/; Max-Age=7d` (`Secure` in production) plus `{ user: { documentId, username, email } }`. `GET /api/auth/me` validates the cookie against `/api/users/me` and clears a stale one. `POST /api/auth/logout` expires it. Server Components read it through `getCurrentUser()` (React `cache()`), under a Suspense boundary.
- **Every write handler is guarded**: JSON body only (415 otherwise) and same origin (`Sec-Fetch-Site`, then `Origin`; 403 otherwise). A request with neither header is tooling, not a browser, and passes.
- **Stable error codes, French messages, no Strapi wording**: 401 `INVALID_CREDENTIALS`, 409 `ALREADY_TAKEN` on the email field (Strapi cannot tell email and username apart), 429 `RATE_LIMITED`, 422 with field keys. Forms translate keys; schemas carry `Form.*` keys as zod messages so the BFF and the form share one definition.
- **Google through Strapi's provider**, configured from the environment at boot (`ensure-providers.ts`), enabled only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. The browser goes to `STRAPI/api/connect/google?callback=<web>/auth/google/callback?next=…&locale=…`; after Google, Strapi redirects to that page; the page fetches `STRAPI/api/auth/google/callback` with credentials (Strapi's session cookie), gets `{ jwt }`, holds it in memory for one request and posts it to `POST /api/auth/session`, which verifies it against `/api/users/me` and sets the session cookie. Nothing is stored client-side.
- **One exception to "the browser never learns the Strapi URL"**: the Google flow needs `NEXT_PUBLIC_STRAPI_URL` for two requests (the connect redirect and the callback fetch). The JWT is exposed to page JavaScript for the duration of one `fetch`, never persisted, never logged.
- **Forms**: TanStack Form `createFormHook` with pre-bound `TextField`, `PasswordField`, `SubmitButton`; each field validates itself on change and on blur with its zod sub-schema, the form validates on submit; errors show once a field was left or a submit attempted.

## Consequences

- Reading is public, writing needs the cookie. The frontend never decides authorization: Strapi forces the author and checks ownership.
- A Google email already registered with a password is refused by Strapi ("already taken"); the callback page explains it. Account linking is an evolution.
- Forgot password and email confirmation need a mailer; the Strapi settings exist (`email_confirmation`, reset-password template) and are off.
- Playwright specs must wait for hydration before typing into a server-rendered form; a reader typing within the first 200 ms would hit the same race.
- Production must serve the web app and Strapi on the same site (for example `app.` and `cms.` of one domain) so Strapi's `SameSite=Lax` session survives the Google round trip.
