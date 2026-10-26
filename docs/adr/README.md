# Architecture Decision Records

Short records of the decisions that shape this codebase. Format: context, decision, consequences.

| #                                                    | Title                                                                 | Status   |
| ---------------------------------------------------- | --------------------------------------------------------------------- | -------- |
| [0001](0001-auth-strapi-users-permissions.md)        | Strapi Users & Permissions as the only identity provider              | Accepted |
| [0002](0002-bff-route-handlers-no-server-actions.md) | BFF through Route Handlers, no Server Actions                         | Accepted |
| [0003](0003-cache-components-and-data-fetching.md)   | Cache Components, DAL and TanStack Query                              | Accepted |
| [0004](0004-monorepo-layout.md)                      | pnpm + Turborepo monorepo with config packages only                   | Accepted |
| [0005](0005-type-sharing-zod-dtos.md)                | zod DTOs as the frontend's type source                                | Accepted |
| [0006](0006-cache-invalidation-webhook.md)           | Tag-based cache invalidation driven by a Strapi webhook               | Accepted |
| [0007](0007-i18n-next-intl.md)                       | French and English from day one with next-intl                        | Accepted |
| [0008](0008-forum-api-rules-in-strapi.md)            | Forum rules enforced in Strapi, document ids only, tests over HTTP    | Accepted |
| [0009](0009-session-cookie-and-google-login.md)      | Session cookie set by Next.js, Google login through Strapi's provider | Accepted |
