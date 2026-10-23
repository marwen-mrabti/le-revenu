# Communauté Le Revenu

Espace communautaire pour les lecteurs du Revenu : discussions, questions et réponses.

Monorepo pnpm + Turborepo :

- `apps/web` — Next.js 16 (App Router, TypeScript, Tailwind, shadcn/ui, TanStack Query + Form, zod)
- `apps/cms` — Strapi 5 (TypeScript, PostgreSQL, Users & Permissions)
- `packages/*` — configurations TypeScript et ESLint partagées

> Statut : en construction. Le README complet (installation, architecture, sécurité, tests, CI/CD) arrive avec la version 1.0.0.

## Démarrage rapide

```bash
cp .env.example .env
cp apps/cms/.env.example apps/cms/.env
cp apps/web/.env.example apps/web/.env
pnpm install
docker compose up -d db
pnpm dev
```

Voir `docs/adr/` pour les décisions d'architecture et `CONTRIBUTING.md` pour les règles de contribution.
