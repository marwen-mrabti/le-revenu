# 07 — Create a discussion

Branch: `feature/discussion-create` · Target: `development` · Estimate: 6 h · Status: approved

## 1. Goal

After this branch, a logged-in reader publishes a discussion from `/discussions/new`: a type (question or discussion), a title of at least 10 characters, a required content, a space. Errors show on the right field, the server's rules apply even if the browser's are bypassed, and a successful publication lands on the new discussion's page. A "Publier" button in the header and in the space cards opens the form, with the space preselected. The same form brings category and type editing to the detail page, which branch 06 left out.

Brief lines served: section 2.C in full, "Formulaire avec titre de 10 caractères minimum, contenu obligatoire, catégorie et type · Afficher les erreurs de validation et rediriger vers la nouvelle discussion après création · Appliquer les validations métier côté Strapi, indépendamment des contrôles du frontend". Last of the three brief pages. Tracker item 17.

## 2. Scope

**In**

- Page `app/[locale]/(forum)/discussions/new/page.tsx`: protected (the proxy already redirects a visitor to `/login?next=/discussions/new`; the page checks the session server-side too), static shell with the form streaming under Suspense, categories from the cached list in the page language, `?category=<slug>` preselects the space.
- `features/discussions`: `discussionCreateSchema` (type enum, title 10–150, content 1–20 000, category documentId), `DiscussionForm` (TanStack Form: type as two radio cards with a subtitle, title with a hint and a placeholder per type, space select, content textarea with counter), `useCreateDiscussion`, success → toast and `router.push('/discussions/<slug>')`, 422 on fields, expired session keeps the text.
- BFF `POST /api/discussions`: guards, session (401), body validated (422), `POST /discussions { data }` with the JWT, answers the created item; the list is not cached, nothing to expire.
- Entry points: "Publier" button in the header for a logged-in reader (visitor: the same button leads to `/login?next=/discussions/new`), "Publier dans cet espace" in the space card of the list and of the detail page, "Lancer la première discussion" in the empty list state.
- Detail page: `DiscussionEditForm` gains the space select and the type radio cards (shared `DiscussionFields`), `PATCH /api/discussions/[documentId]` accepts them; Strapi's `update` already does.
- Messages fr + en, unit tests, Playwright `create.spec.ts` (alice creates, lands on the new page, the list shows it, then deletes it from the page).

**Out**

- Draft autosave, similar-discussion suggestions, polls, article links, mentions, image: mockup extras without data or scope in the brief; evolutions.
- Markdown in the content: same decision as the replies.
- Rate limiting of creations: Strapi's role permissions are the guard; a rate limit is an evolution.

## 3. Acceptance criteria

1. A visitor opening `/discussions/new` lands on `/login?next=/discussions/new` and comes back to the form after login; the header's "Publier" button leads there too.
2. Logged in, the form shows two type cards (question selected by default), the title with its hint, the space select with every space in the page language, the content box with a `0 / 20000` counter, and "Publier" disabled while the form is invalid.
3. A 9-character title shows "10 caractères minimum." on blur; an empty content shows "Ce champ est obligatoire."; no space selected shows "Choisissez un espace."; nothing is sent to the server meanwhile.
4. A valid form creates the discussion in Strapi with the session's reader as author, lands on `/discussions/<slug>` with a toast, the new page shows the title, content, space and type; `/discussions` lists it first.
5. Bypassing the browser (`POST /api/discussions` with a 9-character title, or with an unknown category) answers 422 / 404 from the server; Strapi answers 400 to the same body sent directly with a token, 403 without one.
6. `?category=bourse` preselects the space; the space cards' button carries it; an unknown slug leaves the select empty.
7. An expired session answers 401: the form keeps the text and offers to sign in again, back to the form.
8. On the detail page, the author changes the space and the type inline; the breadcrumb, the meta line and the facts card follow after save.
9. Keyboard: the type cards are a radio group (arrows), every field is labelled, errors are announced; 400 px to 1180 px without horizontal scroll; dark mode.
10. `pnpm verify` green; unit, integration and e2e of section 7 green.

## 4. Mockups

### UI features

- [`docs/mockups/07-discussion-create/create.html`](../mockups/07-discussion-create/create.html): the form at desktop width and at 400 px, with the header's "Publier" button.
- [`docs/mockups/07-discussion-create/create-states.html`](../mockups/07-discussion-create/create-states.html): field errors, expired session, server error, the toast on the new page, the detail page's edit form with space and type, the space card button.

```
┌ header ──────────────────────────────── [Publier] (A) alice ▾ ┐
│ Discussions › Nouvelle publication                             │
│ ┌ form ────────────────────────────────┐ ┌ Conseils ────────┐ │
│ │ (•) Poser une question  ( ) Lancer   │ │ titre clair,     │ │
│ │ Titre ______________________ hint    │ │ contexte, charte │ │
│ │ Espace [Bourse & actions      ▾]     │ └──────────────────┘ │
│ │ Contenu ________________  0 / 20000  │                      │
│ │                            [Publier] │                      │
│ └──────────────────────────────────────┘                      │
└────────────────────────────────────────────────────────────────┘
```

### Backend features

No new entity. Existing `POST /discussions` (Bearer, `{ data: { title, content, type, category } }` → 201 item with author and category, 400 on rules, 403 without token, 404 unknown category). BFF: `POST /api/discussions` `{ title, content, type, category }` → 201 `{ discussion }`; 401 `UNAUTHENTICATED`; 403 `CROSS_ORIGIN`; 404 `NOT_FOUND`; 415; 422 `VALIDATION`; 503 `UNAVAILABLE`.

## 5. Design

- **One form, two uses**: `DiscussionFields` (type cards, title, space, content) is used by `DiscussionForm` (create) and by `DiscussionEditForm` (detail page). The zod schema is shared; the edit schema is the same object.
- **Space list**: the page reads `getCategories(locale)` (cached, tagged) and passes `{ documentId, name, slug }[]` to the client form; the select value is the documentId, what Strapi expects for the relation.
- **Type cards**: a native radio input inside a styled label, so the group works with arrows and screen readers without extra code.
- **Redirect after creation**: `router.push` to the new slug; the new page's read is a cache miss (new entry), so no invalidation is needed; the list is never cached.
- **Protected route**: the proxy's optimistic cookie check sends visitors to login before any render; the page still verifies the session (a stale cookie is caught there) and renders the form only for a reader.
- **Error mapping**: same `mapWriteError` as the replies; a 404 from Strapi on the category becomes a field error on the space.

## 6. Phases and steps

### Phase A — Form and page (3 h)

1. Schema, `DiscussionFields`, `DiscussionForm`, mutation, BFF handler, page with Suspense and category preselection, messages.
2. Entry points: header button, space cards, empty list.
   Exit: criteria 1 to 7 by hand.

### Phase B — Detail edit with space and type (1 h)

3. `DiscussionEditForm` on the shared fields; `PATCH` accepts `type` and `category`.
   Exit: criterion 8.

### Phase C — Tests, docs, delivery (2 h)

4. Unit tests (schema, form, handler), Playwright `create.spec.ts`, README fr + en, plan done, tracker 17 green, `pnpm verify`, push, PR text.

## 7. Tests

| Kind        | File                                                                           | Covers criterion |
| ----------- | ------------------------------------------------------------------------------ | ---------------- |
| unit        | `features/discussions/schemas.test.ts` (create schema)                         | 3, 5             |
| unit        | `features/discussions/components/discussion-form.test.tsx`                     | 2, 3, 7          |
| unit        | `app/api/discussions/route.test.ts` (POST)                                     | 5                |
| integration | existing `discussions.validation.test.ts`, `discussions.auth.test.ts`          | 5                |
| e2e         | `e2e/create.spec.ts` (visitor redirect, alice creates, lands, listed, deletes) | 1, 4             |

## 8. Manual verification

- 400, 760, 1180 px, light and dark, both locales; keyboard through the type cards and fields.
- Strapi stopped: the submit shows the contained error, the text stays.
- `?category=` with a known and an unknown slug.

## 9. Risks and open questions

- The proxy only sees the cookie: a reader with an expired token reaches the page, which then redirects to login (criterion 1 covers it).
- Two forms, one component: the edit form must not reset the type when the reader only changes the title. Covered by the unit test of the edit form.

## 10. Definition of done

Criteria 1–10 green, plan status `done`, tracker 17 green, PR description written, `pnpm verify` green on a clean clone.
