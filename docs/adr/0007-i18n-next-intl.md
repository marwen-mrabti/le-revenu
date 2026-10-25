# ADR-0007 — French and English from day one with next-intl

**Status:** Accepted · 2026-10-25

## Context

The product is French-first but must serve English readers, and more languages may follow. Retrofitting localisation into routing, metadata and content is expensive, so it is designed in from the start. Next.js 16.4 runs with Cache Components, which forbids reading request headers inside cached scopes.

## Decision

- **Library:** next-intl 4.14. Since Next 16.3 it reads the locale from `next/root-params`, so pages stay prerenderable and nothing deprecated (`setRequestLocale`, `requestLocale`) is used. Alternatives: Lingui (more plumbing), Paraglide (requires webpack, we use Turbopack), next-international (unmaintained since 2024).
- **URLs:** `localePrefix: 'as-needed'`, French unprefixed (`/discussions`), others prefixed (`/en/discussions`). `localeDetection: false` so `/` is deterministic for crawlers; readers switch with the header toggle.
- **Messages:** one JSON per locale under `apps/web/messages/`, namespaced per feature. French is the typed source; a test asserts key parity across locales.
- **Dates and relative times:** next-intl formatters with `timeZone: 'Europe/Paris'`; relative times render in a small client component refreshed every minute.
- **SEO:** `<html lang>`, localized `generateMetadata` with canonical, hreflang alternates and Open Graph; `sitemap.ts` with alternates; `robots.ts`.
- **Strapi:** French is the default locale, English is created at boot. Only `Category` is localised; discussions and replies stay in the language they were written in. The frontend resolves a discussion's category label by `documentId` in the current locale and falls back to French.

## Consequences

- Adding a locale: add it to `routing.locales`, add `messages/<code>.json`, add the locale in Strapi, translate the categories. Everything else iterates the locale list.
- Category slugs are identical across locales in v1 so the proxy's alternate links stay one-to-one. Translating slugs later means emitting alternates from `generateMetadata` instead.
- `/discussions/new` is guarded optimistically in `proxy.ts` by cookie presence; real authorization stays server-side.
