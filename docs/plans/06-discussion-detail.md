# 06 — Discussion detail and replies

Branch: `feature/discussion-detail` · Target: `development` · Estimate: 11.5 h · Status: done (2026-10-27)

## 1. Goal

After this branch, every card of the list opens `/discussions/<slug>` (and `/en/discussions/<slug>`): the discussion with its title, content, author, date and category, then its replies in chronological order. A logged-in reader posts a reply from the page and sees it appear; a visitor sees a call to log in that brings them back to the page. Readers edit and delete their own discussion and their own replies from the page; nobody else sees those actions, and Strapi refuses them anyway. The detail read is cached and tagged, invalidated by the reply handler and by a Strapi webhook, which finally delivers ADR-0006.

Brief lines served: section 2.B in full, "Créer une URL propre à chaque discussion · Afficher le titre, le contenu, l'auteur, la date, la catégorie et les réponses associées · Permettre la publication d'une réponse enregistrée dans PostgreSQL via Strapi", plus "every reply linked to a user, posting forbidden to unauthenticated users" (2.D, enforced by Strapi since branch 02) and section 4 (states, responsive, RSC/client split). Tracker items 15 and 16.

## 2. Scope

**In**

- `features/discussions`: `discussionDetailSchema` (list item + `content` + `replies[]` with author), `getDiscussion(slug, locale)` cached with `'use cache'`, `cacheLife('hours')`, tags `strapi:discussions`, `strapi:discussions:<documentId>`; unknown slug → `null`.
- Page `app/[locale]/(forum)/discussions/[slug]/page.tsx`: static shell (breadcrumb skeleton, grid) and three islands: the article (title, meta, content), the replies list, the reply box (form when logged in, call to action otherwise). `generateMetadata` from the cached read (title, description from the first 160 characters, canonical, `noindex` for nothing). `notFound()` for an unknown slug → the locale 404 page.
- `features/replies`: `replySchema` (content 2–5000, trimmed), `ReplyForm` (TanStack Form, textarea with live counter, errors on blur or submit), `useCreateReply`, `ReplyList`, `ReplyItem` (avatar, name, "Auteur" chip when the reply comes from the discussion's author, relative time, content as paragraphs), `RepliesEmpty`.
- BFF `POST /api/replies`: same-origin and JSON guards, session required (401), body validated (422), `POST /replies { data: { content, discussion } }` with the reader's JWT, then `revalidateTag` of the discussion tags; 404 when the discussion is gone. Answers the created reply with its author.
- Cache invalidation (ADR-0006, never built): `POST /api/revalidate` in the web app (secret compared in constant time, `uid` + `documentId` → tags), and `ensure-webhook.ts` in Strapi registering the webhook idempotently at boot with the `x-revalidate-secret` header, for the three content types. Without `WEB_URL` reachable from Strapi nothing breaks: the webhook fails silently in Strapi's log.
- Owner actions: on the article and on each reply, a "Modifier · Supprimer" pair shown only to the author (session compared to `author.documentId`). Edit is inline: the reply's text, the discussion's title and content, same validation rules as creation, Escape or "Annuler" restores the text. Delete asks for confirmation; a deleted reply disappears and the counters update; a deleted discussion sends the reader to the list with a toast. BFF `PATCH` and `DELETE /api/discussions/[documentId]` and `/api/replies/[documentId]`, each invalidating the discussion tags; Strapi's `is-owner` policy stays the authority (403 or 404 when the caller is not the author).
- Right column: "Cette discussion" card (replies, published date, category) and the category card with "Voir les discussions de cet espace"; both come after the replies on mobile.
- Messages fr + en, unit tests, integration test of the webhook route is out (it is a Strapi call to Next; the handler is unit-tested), Playwright `detail.spec.ts`.

**Out**

- "Utile" votes, best answer, follow, share, report, views, mentions, "À lire aussi": mockup extras, no data for them (bonus list of the brief; evolutions).
- Editing a discussion's category or type from the detail page: the full form arrives with the create page (branch 07) and will be reused here then.
- Create page and "Publier dans cet espace" button: branch 07. The category card links to the filtered list for now.
- Markdown or rich text: content is plain text rendered as paragraphs; an evolution with sanitisation.
- Pagination of replies: a discussion has a few dozen replies at most in this product; the detail populate returns them all, in order.

## 3. Acceptance criteria

1. `/discussions/<slug>` of any seeded discussion shows the title, the category (localised, with its colour dot), the type tag for questions, the author's name and avatar, the relative date, and the content with its paragraphs. The breadcrumb reads Discussions › category.
2. Replies appear under the heading "N réponses" in chronological order with author, avatar, relative time and content; a reply by the discussion's author carries an "Auteur" chip. Zero replies shows "Aucune réponse pour l'instant" and an invitation.
3. Logged out: the reply box is a card with "Se connecter pour répondre" leading to `/login?next=/discussions/<slug>`; after login the reader lands back on the discussion.
4. Logged in: the reply form shows "Répondre en tant que <name>", a textarea with a counter (`0 / 5000`), the submit disabled while empty or over the limit; a 1-character reply shows "2 caractères minimum" on blur; a valid reply is posted, the list shows it at the bottom with a highlight, the counter in the heading and the right card update, the form is empty again. A visitor forging the request without a cookie gets 401 from the BFF, 403 from Strapi.
5. The read is cached: a second visit does not call Strapi (Next cache hit); after a reply through the BFF, the next read shows it; after an edit in the Strapi admin, the webhook invalidates and the next read shows it.
6. An unknown slug shows the locale 404 page with the usual header. A Strapi outage shows the article island's error with a retry, the rest of the page intact.
7. `/en/discussions/<slug>`: English UI strings, English category name, French content as written.
8. Metadata: `<title>` is the discussion title with the site name, description is the start of the content, canonical URL per locale with `hreflang` alternates.
9. Keyboard: breadcrumb, reply links, form and buttons in order; the textarea is labelled; errors are announced; the new reply receives focus after posting.
10. Widths 400, 760 and 1180: one column on mobile with the right-column cards after the replies; no horizontal scroll.
11. Owner actions: alice sees "Modifier" and "Supprimer" on her discussion and on her replies, bob does not; editing a reply saves and shows the new text with a "modifié" mention; a reply under 2 characters is refused inline; deleting a reply asks for confirmation then removes it and lowers both counters; deleting the discussion asks for confirmation, then lands on the list with a toast and the slug answers 404. A forged `PATCH` with bob's cookie on alice's reply gets 403 from Strapi, passed through by the BFF.
12. `pnpm verify` green; unit, integration and e2e of section 7 green.

## 4. Mockups

### UI features

- [`docs/mockups/06-discussion-detail/detail.html`](../mockups/06-discussion-detail/detail.html): logged-in reader, three replies, the form; the 400 px frame on the right.
- [`docs/mockups/06-discussion-detail/detail-states.html`](../mockups/06-discussion-detail/detail-states.html): visitor call to action, no replies, form errors, loading skeleton, article error island, 404, and the author's actions (menu, inline edit, delete confirmation).

```
┌ header ───────────────────────────────────────────────────────────────┐
│ Discussions › Bourse & actions                                        │
│ ┌ article ────────────────────────────────┐ ┌ Cette discussion ─────┐ │
│ │ ● Bourse & actions  Question            │ │ 3 réponses · 2 j      │ │
│ │ PEA ou CTO pour un premier ETF ?        │ │ Bourse & actions      │ │
│ │ (A) alice · il y a 2 jours              │ └───────────────────────┘ │
│ │ contenu…                                │ ┌ Cet espace ───────────┐ │
│ └─────────────────────────────────────────┘ │ description + lien    │ │
│ 3 réponses                                  └───────────────────────┘ │
│ ┌ reply ──┐ ┌ reply ──┐ ┌ reply (Auteur) ─┐                           │
│ ┌ Répondre en tant que alice ─────────────┐                           │
│ │ textarea                     0 / 5000   │                           │
│ │                      [Publier ma réponse]│                           │
│ └─────────────────────────────────────────┘                           │
└───────────────────────────────────────────────────────────────────────┘
```

### Backend features

No new entity. Existing API used:

| Method and path                           | Auth                         | Request                                                        | Responses                                                                        |
| ----------------------------------------- | ---------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `GET /discussions/slug/:slug`             | public                       | —                                                              | 200 `{ data: detail }` with `replies[]` sorted `createdAt:asc`; 404 unknown slug |
| `POST /replies`                           | Bearer                       | `{ data: { content, discussion: <documentId> } }`              | 201 reply with author; 400 content rules; 403 no token; 404 unknown discussion   |
| `PUT` / `DELETE /replies/:documentId`     | Bearer + author              | `{ data: { content } }`                                        | 200 / 204; 403 not the author; 404 unknown                                       |
| `PUT` / `DELETE /discussions/:documentId` | Bearer + author              | `{ data: { title, content } }`                                 | 200 / 204 (replies deleted with it); 403 not the author; 404 unknown             |
| `POST <WEB_URL>/api/revalidate`           | header `x-revalidate-secret` | Strapi webhook payload `{ event, uid, entry: { documentId } }` | 204; 401 bad secret; 400 unknown uid                                             |

BFF contract:

| Method and path                        | Body                      | Responses                                                                                                             |
| -------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `POST /api/replies`                    | `{ content, discussion }` | 201 `{ reply }`; 401 `UNAUTHENTICATED`; 403 `CROSS_ORIGIN`; 404 `NOT_FOUND`; 415; 422 `VALIDATION`; 503 `UNAVAILABLE` |
| `PATCH /api/replies/[documentId]`      | `{ content }`             | 200 `{ reply }`; 401; 403 `FORBIDDEN`; 404; 422                                                                       |
| `DELETE /api/replies/[documentId]`     | —                         | 204; 401; 403; 404                                                                                                    |
| `PATCH /api/discussions/[documentId]`  | `{ title, content }`      | 200 `{ discussion }`; 401; 403; 404; 422                                                                              |
| `DELETE /api/discussions/[documentId]` | —                         | 204; 401; 403; 404                                                                                                    |
| `POST /api/revalidate`                 | Strapi webhook payload    | 204; 401; 400                                                                                                         |

Reply sequence: browser → `POST /api/replies` → BFF validates, calls Strapi with the session JWT → Strapi forces the author, checks the discussion exists, saves → BFF `revalidateTag('strapi:discussions:<id>')` → 201 → the client refreshes the server tree (`router.refresh()`), the replies island re-renders from the fresh read, the new reply is highlighted and focused.

## 5. Design

- **Why cache the detail and not the list** (ADR-0003): a discussion page is read far more than written; the list changes with every post. Tags make the cache correct: the reply BFF invalidates the one discussion, the webhook covers admin edits and deletions.
- **`'use cache'` scope**: `getDiscussion(slug, locale)` reads nothing request-bound; the locale is an argument. The session is read only in the reply island, outside the cache scope.
- **Islands**: `DiscussionArticleIsland` (server, cached read, `notFound()` on null), `RepliesIsland` (server, same read, list), `ReplyBoxIsland` (server, reads the session, renders `ReplyForm` or `ReplyCallToAction`). Each under its own `Suspense` with a skeleton; article and replies share the request-level cache of the read.
- **Files**: `features/discussions/{schemas.ts, data.ts}` extended; `features/discussions/components/discussion-article.tsx`, `discussion-article-skeleton.tsx`, `discussion-facts-card.tsx`; `features/replies/{schemas.ts, api/mutations.ts, components/reply-form.tsx, reply-list.tsx, reply-item.tsx, replies-empty.tsx, reply-call-to-action.tsx}`; `app/api/replies/route.ts`; `app/api/revalidate/route.ts`; `lib/cache/tags.ts` (`tagsFor(uid, documentId)` shared by both handlers); cms `src/bootstrap/ensure-webhook.ts`.
- **Validation**: `replySchema = { content: trim, min 2 'replyMin', max 5000 'replyMax', discussion: documentId string }`; Strapi enforces the same lengths (schema.json) independently.
- **Error mapping**: Strapi 404 → `NOT_FOUND` (the page shows "Cette discussion n'existe plus"), 403 → `UNAUTHENTICATED` (the cookie is stale: the form shows "Reconnectez-vous"), 400 → 422 with `content` key.
- **Content rendering**: split on blank lines into `<p>`, `whitespace-pre-line` inside; no HTML ever injected.
- **Owner check in the UI is a convenience only**: the session user's `documentId` decides whether the actions render; Strapi's `is-owner` policy decides whether they succeed. Inline edit reuses the reply form (`ReplyForm` in edit mode) and a small `DiscussionEditForm` (title + content); deletion goes through a shadcn `AlertDialog`.
- **Webhook secret**: `REVALIDATE_SECRET` already required on both sides; comparison with `timingSafeEqual` on equal-length buffers.

## 6. Phases and steps

### Phase A — Detail read and page (3 h)

1. `discussionDetailSchema`, `getDiscussion` cached and tagged, `lib/cache/tags.ts`.
2. Page shell, `generateMetadata`, article island + skeleton, facts card, category card, breadcrumb; 404 on unknown slug.
3. Replies list island: `ReplyList`, `ReplyItem`, `RepliesEmpty`.
   Exit: criteria 1, 2, 6 (404 part), 7, 8, 10 by hand.

### Phase B — Reply (2.5 h)

4. `replySchema`, BFF `POST /api/replies` with tag invalidation, `useCreateReply`.
5. `ReplyForm`, `ReplyCallToAction`, `ReplyBoxIsland`; refresh, highlight and focus after posting.
   Exit: criteria 3, 4, 5 (BFF part).

### Phase B2 — Owner actions (2.5 h)

5b. BFF `PATCH` / `DELETE` for discussions and replies with tag invalidation; `useUpdateReply`, `useDeleteReply`, `useUpdateDiscussion`, `useDeleteDiscussion`.
5c. `OwnerActions` menu, `ReplyForm` edit mode, `DiscussionEditForm`, delete dialogs, toasts, counters refresh.
Exit: criterion 11.

### Phase C — Webhook (1.5 h)

6. `POST /api/revalidate` handler; `ensure-webhook.ts` in Strapi (create or update the webhook named `next-revalidate`, header from `REVALIDATE_SECRET`, URL from `WEB_URL`).
   Exit: criterion 5 (admin edit part), checked by hand with the Strapi admin.

### Phase D — Tests, docs, delivery (2 h)

7. Unit tests of section 7, Playwright `detail.spec.ts`, cms integration test of the webhook registration (store row present, header set).
8. README fr + en (detail page, reply, cache and webhook), ADR-0006 status note, tracker 15–16 green, `pnpm verify`, push, PR text.

## 7. Tests

| Kind        | File                                                                                                     | Covers criterion  |
| ----------- | -------------------------------------------------------------------------------------------------------- | ----------------- |
| unit        | `features/discussions/schemas.test.ts` (detail DTO)                                                      | 1, 2              |
| unit        | `features/replies/components/reply-form.test.tsx`                                                        | 4                 |
| unit        | `features/replies/components/reply-list.test.tsx`                                                        | 2                 |
| unit        | `app/api/replies/route.test.ts`                                                                          | 4                 |
| unit        | `app/api/replies/[documentId]/route.test.ts`, `app/api/discussions/[documentId]/route.test.ts`           | 11                |
| unit        | `features/replies/components/owner-actions.test.tsx`                                                     | 11                |
| unit        | `app/api/revalidate/route.test.ts`                                                                       | 5                 |
| unit        | `lib/cache/tags.test.ts`                                                                                 | 5                 |
| integration | `apps/cms/tests/webhook.test.ts`                                                                         | 5                 |
| integration | existing `replies.test.ts`, `discussions.list.test.ts` (slug)                                            | 1, 4              |
| e2e         | `e2e/detail.spec.ts` (open from the list, visitor CTA, alice replies, edits then deletes her reply, 404) | 1, 2, 3, 4, 6, 11 |

## 8. Manual verification

- 400, 760, 1180 px, light and dark, both locales.
- Keyboard through breadcrumb, replies, form; screen reader announces the counter and errors.
- Strapi stopped: article island error with retry, header and right column intact.
- Admin edit of a title → page updated on the next visit (webhook); reply through the UI → visible at once.
- No console error, no `STRAPI_URL` in the bundle.

## 9. Risks and open questions

- `notFound()` thrown inside an island under `Suspense`: Next renders the segment's not-found; the locale catch-all page must stay the fallback. Checked first in Phase A.
- Replies populate without pagination: fine for this product; a cap of 200 is noted as an evolution.
- The webhook needs Strapi to reach `WEB_URL`; in Docker-only setups it is `http://web:3000`, documented.

## 10. Definition of done

Criteria 1–12 green, plan status `done`, tracker 15 and 16 green, PR description written, `pnpm verify` green on a clean clone.
