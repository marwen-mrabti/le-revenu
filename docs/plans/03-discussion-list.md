# 03 — Discussion list

Branch: `feature/discussion-list` · Target: `development` · Estimate: 11.5 h · Status: done

## 1. Goal

After this branch, `/discussions` (and `/en/discussions`) shows the community's discussions from Strapi: title, category, type, author, reply count and age, newest first, ten per page, with a category filter, a newest/oldest sort and a text search, all kept in the URL. Every state exists: loading skeleton, empty, error with retry, and the page works at 400, 760 and 1180 px. It is the first page a reviewer sees, so it also lays down the data layer every later page reuses: typed Strapi client, zod DTOs, server-side prefetch hydrated into TanStack Query, BFF route handlers.

Brief lines served: "Home: discussions from the Strapi API (title, author, category, reply count, date), filter by category, sort by date, link to detail. Nothing hardcoded." · "reusable components, centralised typed Strapi calls, coherent RSC/Client split, loading/error/empty states, responsive, overall respect of the mockup" · "Backend pagination + sorting" (consumed here).

## 2. Scope

**In**

- Brand tokens from the mockup in `globals.css` (red `#eb0f0f`, background `#f5f5f7`, ink `#1d1d1f`, 14 px radius, dark values), replacing the shadcn greys. First UI branch, so it owns the theme.
- `config/env.ts` (t3-env), `lib/strapi/{base,public,schemas}.ts`, `lib/api/{client,errors}.ts`, `lib/query/get-query-client.ts`, `app/providers.tsx` (QueryClientProvider + NuqsAdapter).
- Forum layout `(forum)/layout.tsx`: three columns ≥ 1180 (category nav · list · "this space" card), two ≥ 760, one below; `max-w-[1260px] px-4`.
- `features/categories`: DTO, DAL (`'use cache'`, tag `strapi:categories`, per locale), `CategoryNav` (left column, desktop) and `CategoryChips` (horizontal scroll, mobile).
- `features/discussions`: DTO, filters schema, nuqs search params, DAL `getDiscussions(filters, locale)`, `discussionQueries.list(filters)`, `DiscussionCard`, `DiscussionList`, `DiscussionFilters` (sort + search), `DiscussionPagination`, `DiscussionListSkeleton`, `DiscussionListEmpty`.
- BFF: `GET /api/discussions` and `GET /api/categories` (used by client-side refetches after a filter change).
- `page.tsx` composition under Suspense, `loading.tsx`, `error.tsx` with retry, `generateMetadata` with the category name when filtered.
- Messages fr + en for every new string; category names come from Strapi in the page locale.
- Header controls: a `ThemeToggle` (light / dark / system through next-themes, class strategy, no flash on load) and a `LocaleMenu` replacing the `FR | EN` text of branch 01: a dropdown button showing the current flag and language name, listing every locale with flag, native name, code and a check mark; the theme segment lives in the same menu on mobile.
- Unit tests of section 7.

**Out**

- Discussion detail page, reply list and form: branch 04. The card links to `/discussions/[slug]`; until 04 lands that URL shows the global not-found page.
- Create page, login, "Publier" button and user menu: branch 05. The right-column card shows the space description only.
- The mockup's tabs (Tendances / Pour vous / Sans réponse), compact view, pinned topics, "Nouveau" badge, likes, views, avatars of repliers: no data for them in the brief. Noted as evolutions in the README.
- Playwright e2e: configured in branch 04 when there is a second page to navigate to.
- Caching the list: lists stay fresh (ADR-0003).

## 3. Acceptance criteria

1. `/discussions` renders the first ten discussions newest first, each card showing title, category name, type tag (only for questions), author username, relative age and reply count. Nothing is hardcoded: emptying the Strapi database shows the empty state.
2. `?category=bourse` shows only that category, the left nav marks it active, the right card shows its description, the page title becomes "Bourse & actions · Discussions". An unknown slug shows the empty state, not an error.
3. `?sort=oldest` reverses the order; `?sort=newest` and no param are equivalent and the URL stays clean (`clearOnDefault`).
4. `?q=per` filters on title or content, case-insensitive, accent-insensitive at the Strapi level (`$containsi`); typing in the search box updates the URL after a 300 ms debounce and the list refetches through the BFF without a full navigation.
5. `?page=2` shows the next ten; the pagination shows page links with `aria-current="page"`, previous/next disabled at the ends; the total comes from `meta.pagination`, never from an array length. `?page=99` shows the empty state with a link back to page 1. `?page=abc` is treated as page 1.
6. Filters compose: `?category=bourse&sort=oldest&q=etf&page=1` works and the sort select, search box and chips reflect the URL on reload.
7. `/en/discussions` shows English category names and English UI strings; French discussions stay in French.
8. Loading: `loading.tsx` renders the same grid with ten skeleton cards, no layout shift when data arrives. Error: a Strapi outage shows `error.tsx` with a "Réessayer" button that calls `retry()`. Empty: shadcn `Empty` with the mockup's wording.
9. The page is usable at 400 px (one column, chips scroll horizontally, cards stack the counter above the text), 760 px (two columns) and 1180 px (three columns); no horizontal scroll at any width.
10. Keyboard: every card is one focusable link covering the title; filters and pagination are reachable in order; focus rings visible; `<main id="content">` targeted by the skip link.
11. No `STRAPI_URL` reaches the browser bundle; the browser only ever calls `/api/*`.
12. `pnpm verify` green; unit tests of section 7 pass; Lighthouse accessibility ≥ 95 on the list (manual check).
13. Theme: the toggle switches light / dark / system; the choice survives a reload with no flash of the wrong theme; every component (cards, chips, menus, skeleton, empty, error) reads correctly in both.
14. Language menu: shows the current flag and name; the list offers each locale with its flag, native name and code, marks the current one, keeps the current path and search params when switching, is operable by keyboard (arrow keys, Enter, Escape) and announced as a menu.

## 4. Mockups

### UI features

Files, opened in the browser during review:

- `docs/mockups/03-discussion-list/list.html` — default state, desktop and responsive (resize to 760 and 400), light and dark (OS setting).
- `docs/mockups/03-discussion-list/list-states.html` — loading skeleton, empty, error, side by side.
- `docs/mockups/03-discussion-list/list-sizes.html` — the default page framed at 400, 760 and 1180 px side by side.
- Header controls are in `list.html`: theme button (sun / moon) and the open language menu (flag, native name, code, check mark, theme segment at the bottom).

Desktop ≥ 1180:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ LE REVENU · Communauté                                        FR | EN        │
├───────────┬──────────────────────────────────────────────────┬───────────────┤
│ Espaces   │ Discussions                                      │ Cet espace    │
│ ● Tous    │ Posez vos questions d'argent, partagez…          │ Bourse &      │
│   Bourse  │ ┌──────────────────────────────────────────────┐ │ actions       │
│   Immo    │ │ [Rechercher…           ] [Plus récentes ▾]   │ │ Actions, ETF, │
│   Impôts  │ ├──────────────────────────────────────────────┤ │ PEA…          │
│   …       │ │ ┌────┐ Bourse & actions · Question           │ │               │
│           │ │ │ 3  │ Faut-il ouvrir un PER à 45 ans ?       │ │               │
│           │ │ │rép.│ Mon taux actuel est plus élevé que…    │ │               │
│           │ │ └────┘ (A) alice · il y a 3 h                 │ │               │
│           │ ├──────────────────────────────────────────────┤ │               │
│           │ │ ┌────┐ Immobilier & SCPI                      │ │               │
│           │ │ │ 0  │ Crédit immobilier : renégocier…        │ │               │
│           │ │ …                                            │ │               │
│           │ └──────────────────────────────────────────────┘ │               │
│           │        ‹ 1 2 3 … 5 ›   18 discussions            │               │
└───────────┴──────────────────────────────────────────────────┴───────────────┘
```

Mobile < 760: header · title · chips row (Tous · Bourse · Immo…) scrolling horizontally · search · sort · cards (counter above the text) · pagination (previous / next only).

### Backend features

None added. Consumed from branch 02:

| Call                   | Query built by the DAL                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/discussions` | `pagination[page]=N&pagination[pageSize]=10&sort=createdAt:desc\|asc&filters[category][slug][$eq]=…&filters[$or][0][title][$containsi]=q&filters[$or][1][content][$containsi]=q` |
| `GET /api/categories`  | `locale=fr\|en&sort=name:asc&pagination[pageSize]=50`                                                                                                                            |

DTO actually received (list item): `documentId, title, slug, content, type, createdAt, updatedAt, publishedAt, author { documentId, username }, category { documentId, name, slug, color }, replies { count }`. The frontend parses exactly this and ignores the rest.

## 5. Design

### Files

```
src/
├─ config/env.ts                       t3-env: STRAPI_URL, AUTH_COOKIE_NAME, REVALIDATE_SECRET (server), NEXT_PUBLIC_APP_URL
├─ app/
│  ├─ providers.tsx                    'use client': QueryClientProvider + NuqsAdapter (+ devtools in dev)
│  ├─ [locale]/layout.tsx              wraps children in <Providers>
│  ├─ [locale]/(forum)/layout.tsx      <SiteHeader/> + grid: <CategoryNav/> | children | <SpaceCard/>
│  ├─ [locale]/(forum)/discussions/page.tsx   loading.tsx   error.tsx
│  └─ api/discussions/route.ts   api/categories/route.ts
├─ features/
│  ├─ categories/
│  │  ├─ schemas.ts                    categorySchema, Category
│  │  ├─ data.ts                       'server-only': getCategories(locale) under 'use cache' + cacheTag('strapi:categories') + cacheLife('hours')
│  │  ├─ api/queries.ts                categoryQueries.list(locale)
│  │  └─ components/category-nav.tsx   category-chips.tsx   space-card.tsx
│  └─ discussions/
│     ├─ schemas.ts                    discussionListItemSchema, discussionFiltersSchema (category?, sort, q?, page)
│     ├─ search-params.ts              nuqs parsers: category (string), sort (enum, default newest), q (string), page (int ≥ 1, default 1); loadDiscussionFilters = createLoader(...)
│     ├─ data.ts                       'server-only': getDiscussions(filters, locale) → { items, pagination }
│     ├─ api/queries.ts                discussionQueries.all / lists / list(filters, locale)
│     └─ components/
│        discussion-card.tsx           one DTO in; <article> with a single <Link> over the title
│        discussion-list.tsx           'use client': useSuspenseQuery(list(filters)), renders cards or <DiscussionListEmpty/>
│        discussion-filters.tsx        'use client': search Input (debounced) + sort Select, bound to nuqs useQueryStates
│        discussion-pagination.tsx     links built from meta.pagination, locale-aware <Link>
│        discussion-list-skeleton.tsx  discussion-list-empty.tsx
├─ lib/
│  ├─ strapi/base.ts                   strapiFetch(path, { query, schema, tags, locale }) + StrapiError; only reader of STRAPI_URL
│  ├─ strapi/public.ts                 anonymous reads
│  ├─ strapi/schemas.ts                strapiList(item), strapiOne(item), strapiErrorSchema, paginationSchema, publicUserSchema
│  ├─ api/client.ts                    bffGet(path, schema, signal) + ApiError
│  ├─ api/errors.ts                    StrapiError/ZodError → Response { code, message, fieldErrors? }
│  └─ query/get-query-client.ts        server: new per request · browser: singleton · staleTime 60 s
└─ components/shared/relative-time.tsx (exists) · components/form/ (branch 05)
```

### Data flow (list page)

1. `page.tsx` awaits `searchParams`, parses them with `loadDiscussionFilters` (nuqs `createLoader`), reads the locale.
2. Under `<Suspense fallback={<DiscussionListSkeleton/>}>`, a server component creates the per-request QueryClient, `void queryClient.prefetchQuery({ ...discussionQueries.list(filters, locale), queryFn: () => getDiscussions(filters, locale) })`, and renders `<HydrationBoundary state={dehydrate(queryClient)}><DiscussionList filters/></HydrationBoundary>`.
3. `DiscussionList` (client) calls `useSuspenseQuery(discussionQueries.list(filters, locale))`; the client `queryFn` is `bffGet('/api/discussions?…')`. On first render the data is already in the cache, so no request. A filter change (nuqs updates the URL with `shallow: true`) gives a new key → BFF fetch → Strapi.
4. `GET /api/discussions` parses the query with `discussionFiltersSchema`, calls the same `getDiscussions`, returns the DTO. 422 on an invalid sort or page.
5. Categories are a Server Component read (`getCategories(locale)`, cached), rendered in the layout; the chips component receives the array as a prop (one DTO in).

Why nuqs `shallow: true` and not a server navigation: the shell (layout, nav, space card) stays put, only the list refetches. The URL still carries the state so reloads and shared links work; `page.tsx` handles those through the prefetch.

### Search

`q` is trimmed, max 80 characters, debounced 300 ms (`limitUrlUpdates: debounce(300)` in nuqs). Empty string clears the param. Strapi `$containsi` is case-insensitive; accents are matched as typed (Postgres ILIKE), documented as a limitation.

### Pagination

`pageSize` is fixed to 10 (Strapi default) and not exposed in the URL for v1; the BFF accepts `pageSize` ≤ 50 for later use. Page links are real `<Link>`s with the full search params so they prefetch and work without JavaScript; the current page has `aria-current="page"`. Mobile shows previous/next plus "page N sur M".

### Error mapping

| Where | Case                             | Result                                                                                            |
| ----- | -------------------------------- | ------------------------------------------------------------------------------------------------- |
| DAL   | Strapi unreachable or 5xx        | `StrapiError` → `error.tsx` (server) or `ApiError 502` (BFF) → `error.tsx` via thrown query error |
| BFF   | bad `sort` / `page`              | 422 `{ code: 'VALIDATION', fieldErrors }`                                                         |
| DAL   | zod parse failure on Strapi JSON | `StrapiError('INVALID_RESPONSE')`, logged with the path                                           |

### Theme

`globals.css` gets the mockup values: `--brand #eb0f0f`, `--background #f5f5f7`, `--foreground #1d1d1f`, `--border #e5e5ea`, `--card #ffffff`, `--muted-foreground #6e6e73`, `--radius 0.875rem`; dark: `--background #161618`, `--card #1c1c1e`, `--border #38383a`, `--foreground #f5f5f7`, `--brand #ff6961` on text. Mapped on the shadcn names so every `ui/` component follows. Rule kept from voice2work: semantic tokens only in `className`.

Dark mode mechanism: next-themes `ThemeProvider` in `app/providers.tsx` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`; `<html suppressHydrationWarning>`. The provider injects the inline script that sets `.dark` before paint, so there is no flash. `ThemeToggle` (`components/layout/theme-toggle.tsx`, client) renders after mount only (`useSyncExternalStore` or a mounted flag) to avoid a hydration mismatch on the icon.

### Header controls

- `LocaleMenu` (`components/layout/locale-menu.tsx`, client, replaces `locale-switcher.tsx`): shadcn `DropdownMenu` with `DropdownMenuRadioGroup`; trigger shows the current flag + native name on desktop, flag only under 760 px; items `🇫🇷 Français · FR`, `🇬🇧 English · EN`, current one checked. Switching uses `useRouter().replace(pathname, { locale })` from `@/i18n/navigation` with the current search params preserved. Locale metadata (flag, native name) lives in `src/i18n/locales.ts` next to `routing.ts`, so adding a language is one entry there plus the messages file. Flags are decorative (`aria-hidden`); the accessible name is the language name.
- `ThemeToggle`: an icon button on desktop (sun / moon, `aria-label` describes the action), and a three-segment radio (Clair / Sombre / Système) inside the `LocaleMenu` footer on mobile.

### Components, size budget

| Component                       | Lines     | Client?                                        |
| ------------------------------- | --------- | ---------------------------------------------- |
| `page.tsx`                      | ≤ 60      | no                                             |
| `DiscussionList`                | ≤ 60      | yes                                            |
| `DiscussionCard`                | ≤ 80      | no (receives DTO)                              |
| `DiscussionFilters`             | ≤ 90      | yes                                            |
| `DiscussionPagination`          | ≤ 90      | no                                             |
| `CategoryNav` / `CategoryChips` | ≤ 60 each | no / yes (active state from `useSearchParams`) |

## 6. Phases and steps

### Phase A — Foundation (2 h)

1. Brand tokens in `globals.css`, light and dark; check every existing component still reads well.
2. `config/env.ts` (t3-env), `.env.example` unchanged.
3. `lib/strapi/{base,public,schemas}.ts` with `StrapiError`; `lib/api/{client,errors}.ts`; `lib/query/get-query-client.ts`; `app/providers.tsx` mounted in `[locale]/layout.tsx`.
   Exit: `type-check` green; a temporary server log of `getCategories('fr')` prints 11 names, then removed.

### Phase B — Layout and categories (2 h)

4. `features/categories/{schemas,data}.ts` with `'use cache'` + tag.
5. `(forum)/layout.tsx` grid; `CategoryNav` (desktop), `CategoryChips` (mobile), `SpaceCard` (right column: all spaces intro, or the selected category's description).
6. Messages fr/en: `Categories.all`, `Space.*`, `Theme.*`, `Locale.*`.
7. `src/i18n/locales.ts` (flag, native name per locale), `ThemeToggle`, `LocaleMenu` in `SiteHeader`; remove `locale-switcher.tsx` and move its test.
   Exit: `/discussions` and `/en/discussions` show the nav in the right language at the three widths; theme and language switch work and persist; criteria 7 (categories part), 9 (layout part), 13, 14.

### Phase C — The list (4 h)

8. `features/discussions/{schemas,search-params,data}.ts`, `api/queries.ts`.
9. `GET /api/discussions`, `GET /api/categories` with zod query validation and the error mapper.
10. `DiscussionCard`, `DiscussionList`, `DiscussionListEmpty`, `DiscussionListSkeleton`.
11. `DiscussionFilters` (search + sort) and `DiscussionPagination`.
12. `page.tsx` (prefetch + hydration under Suspense), `loading.tsx`, `error.tsx`, `generateMetadata`.
    Exit: criteria 1 to 8 by hand with the seeded data; network tab shows one BFF call per filter change and none on first load.

### Phase D — Polish, tests, docs (2 h)

13. Responsive and keyboard pass at 400 / 760 / 1180, light and dark; Lighthouse a11y.
14. Unit tests of section 7.
15. README section 4 (what the app does) and 8 (frontend tests) updated; `docs/plans/README.md` row; this plan set to done; evolutions list (tabs, compact view, pinned).
16. `pnpm verify`, push, PR with screenshots at the three widths.

## 7. Tests

| Kind | File                                                                                                                                                                        | Covers criterion |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| unit | `features/discussions/schemas.test.ts` — filters schema: defaults, `sort` enum, `page` coercion (`abc` → 1, `0` → 1), `q` trim/max                                          | 3, 5, 6          |
| unit | `features/discussions/search-params.test.ts` — URL ↔ state round trip, `clearOnDefault`                                                                                     | 3, 6             |
| unit | `features/discussions/components/discussion-card.test.tsx` — renders title link to `/discussions/<slug>`, category, author, reply count plural, type tag only for questions | 1, 10            |
| unit | `features/discussions/components/discussion-pagination.test.tsx` — links, `aria-current`, disabled ends, out-of-range page                                                  | 5                |
| unit | `app/api/discussions/route.test.ts` — 422 on bad sort, 200 nominal with `strapiFetch` mocked, 502 mapping when Strapi throws                                                | 5, 11            |
| unit | `lib/strapi/base.test.ts` — query string built with `qs`, zod failure → `StrapiError`                                                                                       | 11               |
| unit | `messages/messages.test.ts` (exists) — key parity fr/en covers the new namespaces                                                                                           | 7                |
| unit | `components/layout/locale-menu.test.tsx` — lists both locales with flag and name, marks the current one, switching keeps path and search params                             | 14               |
| unit | `components/layout/theme-toggle.test.tsx` — cycles light / dark / system and calls `setTheme`                                                                               | 13               |

## 8. Manual verification

- [ ] Three widths, light and dark, no horizontal scroll
- [ ] Keyboard only: skip link → chips → search → sort → first card → pagination
- [ ] Empty database → empty state; Strapi stopped → error page → start Strapi → "Réessayer" recovers
- [ ] `?page=99`, `?page=abc`, `?sort=zzz` (treated as newest), `?category=nope`
- [ ] Network tab: no request to `localhost:1337` from the browser
- [ ] `/en/discussions?category=bourse` → "Stocks & markets" in nav, card and title
- [ ] No console errors or hydration warnings

## 9. Risks and open questions

| Risk or question                                                        | Mitigation or decision needed                                                                                       |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `next/root-params` locale inside `'use cache'` for categories           | Pass `locale` as an argument to the cached function; never read request APIs inside it                              |
| nuqs `createLoader` with Cache Components (`searchParams` is a promise) | Supported in nuqs 2.x: `await loadDiscussionFilters(searchParams)`; page is dynamic under Suspense                  |
| HydrationBoundary + `useSuspenseQuery` double fetch on the client       | Same `queryKey` and `staleTime 60 s`; `shouldDehydrateQuery` includes pending queries                               |
| Category description per locale in the right card                       | Comes from the same `getCategories(locale)` call; no extra request                                                  |
| Search debounce vs. back button                                         | nuqs `history: 'replace'` for `q`, `'push'` for category/sort/page                                                  |
| Strapi `$or` filter allowed for Public role                             | Verified in branch 02 tests: filters on `title`, `content`, `category.slug` pass the sanitizer; `author` is refused |

## 10. Definition of done

- [x] All acceptance criteria met (1 to 8, 11 to 14 checked by curl and unit tests; 9, 10, 12 Lighthouse by hand)
- [x] Tests in section 7 green locally and in CI
- [ ] Manual checklist done
- [x] Docs updated (README, this plan's status, plans index)
- [ ] PR opened against `development` with screenshots
