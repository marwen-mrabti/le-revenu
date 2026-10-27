# ADR-0010 — Mailer, email confirmation, account page and Google account linking

**Status:** Accepted · 2026-10-27

## Context

ADR-0009 shipped login, sign-up and Google login and left three gaps: no way to recover a forgotten password, no proof that a sign-up owns its email, and a Google login on an email that already has a password was refused by Strapi ("Email is already taken"). Readers also had no page to change their name, username or password, or to delete their account. Google returns a display name and a picture that the site did not keep.

## Decision

- **Mailer = Strapi's email plugin with the nodemailer provider.** Transport from the environment: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_REPLY_TO`. Development uses Mailpit (`docker compose up -d mailpit`, SMTP on 1025, every mail readable at http://localhost:8025 and through its JSON API, which the Playwright spec uses). Without `SMTP_HOST` the provider is nodemailer's `jsonTransport`: mails are serialised and dropped, Strapi logs one warning at boot, nothing crashes. Production takes any SMTP relay (Resend, Brevo, Postmark all expose one).
- **Settings and templates are set at boot** (`ensure-email.ts`), idempotent, from `WEB_URL`: reset link `${WEB_URL}/api/auth/reset?code=…`, confirmation landing `${WEB_URL}/api/auth/confirmed`, French templates with an English line. Strapi knows one URL per mail and no locale, so both land on a small handler that picks the reader's language (next-intl's cookie, else `Accept-Language`) and redirects to `/reset-password?code=…` or `/login?confirmed=1` under the right prefix. A clone gets the same mails.
- **Email confirmation is tied to the mailer.** With a mailer, sign-up creates a pending account (`POST /api/auth/register` answers `{ user, pending: true }`, no cookie), the web app shows `/verify-email` with a resend button (one minute between sends), and login answers 403 `EMAIL_NOT_CONFIRMED` until the link is used. Without a mailer (zero-setup SQLite mode), confirmation is off: a pending account could never be activated. Demo and Google accounts are confirmed.
- **Forgot / reset through Strapi's own flow.** `POST /auth/forgot-password` always answers 200 (no account enumeration); the page says the same sentence either way. `POST /auth/reset-password` takes the mailed code and the new password twice, answers a JWT: the BFF sets the session cookie, the reader is logged in without visiting the login page. A used or unknown code is 400 `INVALID_CODE`; the page offers a new link.
- **Two profile fields on the Users & Permissions user**, added through the plugin extension (`src/extensions/users-permissions/content-types/user/schema.json`): `displayName` (2–60, optional) and `avatarUrl` (URL, optional). The presenter exposes them next to `username` (never the email); cards and the header prefer the display name and fall back to initials.
- **Google profile**: the provider is re-registered with the `profile` scope and an `authCallback` that reads `https://www.googleapis.com/oauth2/v3/userinfo` (`name` → `displayName`, `picture` → `avatarUrl`). `next.config.ts` allows `lh3.googleusercontent.com` for the picture.
- **Google linking**: `providers.connect` is wrapped. When Strapi refuses a Google login because the email exists with a password, the wrapper fetches the Google profile again, finds the local user by that email, fills an empty display name and picture, and returns that user: the reader lands in their existing account and the password keeps working. Google verified the email, so the link is safe; the reverse (a password sign-up on a Google email) still fails with 409 and the message says to use Google.
- **Account page `/account`** (protected, redirect to `/login?next=/account`): profile form (display name, username), change password (current password required; Strapi answers a new JWT and the cookie follows; hidden for Google-only accounts, who are sent to "forgot password" to add one), delete account (the exact username must be typed). BFF: `PATCH /api/account` → `PUT /users/:id` with `username` and `displayName` only, `DELETE /api/account` → `DELETE /users/:id` then the cookie is cleared.
- **`is-self` policy** on `user.update` and `user.destroy` (granted to Authenticated): the id must be the caller's own, and the body is reduced to `username` and `displayName`; `email`, `role`, `confirmed`, `blocked`, `provider` cannot be changed through the API. Nobody can list users.
- **Deleted accounts**: Strapi sets the author relation to null; the presenter answers `author: null` and the cards print "Compte supprimé". Discussions and replies stay.

## Consequences

- The "two-minute start" (SQLite, no Docker) keeps working: no mail, no confirmation, sign-up logs in at once, as before.
- The full start needs one more container (`docker compose up -d db mailpit`); a sign-up without Mailpit running waits for a mail that was dropped. The README says so and the boot warning names the variable.
- Resending a confirmation invalidates the previous link (Strapi regenerates the token); the newest mail is the right one. An expired or used confirmation link is answered by Strapi itself (JSON 400), not by a branded page: an evolution.
- Logging out leaves the 7-day JWT valid until it expires (tracker 32, unchanged). Changing the password rotates it.
- Email change is out of scope: it needs a confirmation of the new address and Strapi has no built-in flow for it.
- Google linking relies on Google having verified the email; a provider that does not verify emails must not be linked this way.
