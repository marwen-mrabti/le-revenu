# Architecture

Next.js renders and serves the site. Strapi owns data, validation and permissions. PostgreSQL stores it. The browser never learns the Strapi URL.

## System

```mermaid
flowchart LR
    B["Browser<br/>client components"]
    RSC["Next.js Server Components<br/>features/*/data.ts (server-only)"]
    BFF["Next.js Route Handlers<br/>app/api/** (zod, cookie)"]
    S["Strapi 5<br/>controllers · policies · Users & Permissions"]
    P[("PostgreSQL")]

    B -- "JSON + httpOnly cookie" --> BFF
    BFF -- "Bearer JWT" --> S
    RSC -- "tagged fetch" --> S
    RSC -- "streamed HTML + dehydrated queries" --> B
    S --> P
    S -. "webhook on entry change" .-> BFF
```

Rules:

1. Server Components read through the data access layer and never call the app's own Route Handlers.
2. Client Components only call `/api/*`.
3. Route Handlers validate input with zod, forward the JWT, map errors, never return the JWT.
4. Strapi is the single source of truth for data rules (ADR-0001, ADR-0002).

## Read a list page

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Next (RSC)
    participant S as Strapi
    B->>N: GET /discussions?category=bourse&sort=newest
    N->>N: parse search params (nuqs loader)
    N->>S: GET /api/discussions?filters…&sort…&pagination… (tagged strapi:discussions)
    S-->>N: { data[], meta.pagination }
    N-->>B: HTML shell + dehydrated query
    B->>B: hydrate, useSuspenseQuery (no refetch, staleTime 60s)
    B->>N: GET /api/discussions?… (only when filters change)
```

## Log in

```mermaid
sequenceDiagram
    participant B as Browser
    participant H as Next route handler
    participant S as Strapi
    B->>H: POST /api/auth/login { identifier, password }
    H->>H: zod, same-origin check
    H->>S: POST /api/auth/local
    S-->>H: { jwt, user }
    H-->>B: 200 { user } + Set-Cookie lr_session (httpOnly, SameSite=Lax)
    Note over B,H: the JWT never reaches browser JavaScript
```

## Create a discussion

```mermaid
sequenceDiagram
    participant B as Browser
    participant H as Next route handler
    participant S as Strapi
    participant P as PostgreSQL
    B->>H: POST /api/discussions { title, content, category, type }
    H->>H: zod (title ≥ 10, content, category, type)
    H->>H: read cookie → 401 if absent
    H->>S: POST /api/discussions (Bearer)
    S->>S: Users & Permissions: token → user, role Authenticated
    S->>S: permission discussion.create ✔
    S->>S: controller: drop client author, validate, set author = user, make slug
    S->>S: schema validation (minLength, required, enum)
    S->>P: insert discussion + link rows
    S-->>H: 201 { data }
    H->>H: revalidateTag('strapi:discussions', 'max')
    H-->>B: 201 { discussion }
    B->>B: invalidate queries, router.push(/discussions/[slug])
```

Failure paths: no token → 403 from Strapi (Public lacks `create`); short title → 400 `ValidationError` mapped to 422 with field errors; client-supplied `author` → ignored.

## Keep cached pages honest

```mermaid
sequenceDiagram
    participant A as Strapi admin
    participant S as Strapi
    participant H as Next /api/revalidate
    A->>S: edit a category
    S->>H: POST { event, uid, entry.documentId } + x-revalidate-secret
    H->>H: constant-time secret check → 401 if wrong
    H->>H: revalidateTag('strapi:categories', 'max')
    H-->>S: 200 { revalidated: [...] }
```

Lists are never cached; categories and discussion detail reads are cached with tags (ADR-0003, ADR-0006).

## Localisation

French is the default locale and keeps clean URLs (`/discussions`); other locales are prefixed (`/en/discussions`). UI strings, metadata and dates are localised in Next. Only categories are localised in Strapi; the data access layer passes the current locale and falls back to French.
