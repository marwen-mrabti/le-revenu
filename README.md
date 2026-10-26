# Communauté Le Revenu

Espace communautaire pour les lecteurs du Revenu : poser une question d'argent, partager une expérience, répondre aux autres membres.

Test technique Développeur Full Stack · Next.js 16 · Strapi 5 · PostgreSQL (ou SQLite sans installation).

---

## Sommaire

1. [Démarrage en 2 minutes (SQLite, sans Docker)](#1-démarrage-en-2-minutes-sqlite-sans-docker)
2. [Démarrage complet (Docker + PostgreSQL)](#2-démarrage-complet-docker--postgresql)
3. [Comptes de démonstration](#3-comptes-de-démonstration)
4. [Ce que fait l'application](#4-ce-que-fait-lapplication)
5. [Architecture](#5-architecture)
6. [Modèle de sécurité](#6-modèle-de-sécurité)
7. [API](#7-api)
8. [Tests](#8-tests)
9. [Qualité et CI/CD](#9-qualité-et-cicd)
10. [Structure du dépôt](#10-structure-du-dépôt)
11. [Choix d'architecture](#11-choix-darchitecture)
12. [Évolutions](#12-évolutions)

---

## 1. Démarrage en 2 minutes (SQLite, sans Docker)

Prérequis : Node 24 et pnpm 10.

```bash
pnpm install
pnpm --filter cms dev:sqlite      # Strapi sur http://localhost:1337, base SQLite pré-remplie
pnpm --filter web dev             # Next.js sur http://localhost:3000 (second terminal)
```

- La base `apps/cms/database/demo.sqlite` est livrée pré-remplie (catégories en français et en anglais, discussions, réponses, lecteurs de démonstration). Elle est copiée dans `.tmp/` à chaque lancement : le fichier versionné n'est jamais modifié.
- Le panneau d'administration Strapi demande de créer un compte administrateur à la première visite de http://localhost:1337/admin.
- Le fichier `apps/cms/.env.sqlite` contient des clés de démonstration ; il n'est pas destiné à la production.

## 2. Démarrage complet (Docker + PostgreSQL)

Prérequis : Node 24, pnpm 10, Docker avec Compose v2.

```bash
cp .env.example .env
cp apps/cms/.env.example apps/cms/.env    # puis remplacer chaque "change-me" (openssl rand -base64 32)
cp apps/web/.env.example apps/web/.env
# Optionnel, connexion Google : créer un client OAuth « Web » (Google Cloud) avec l'URI de redirection
# http://localhost:1337/api/connect/google/callback, puis dans apps/cms/.env : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
# et dans apps/web/.env : NEXT_PUBLIC_GOOGLE_LOGIN=true. Sans ces valeurs, le bouton Google n'apparaît pas.
pnpm install
docker compose up -d db                   # PostgreSQL 16, bases lerevenu et lerevenu_test
pnpm dev                                  # Strapi :1337 + Next :3000 via Turborepo
```

Au premier démarrage, Strapi crée les tables, les deux locales (fr par défaut, en), les permissions des rôles, puis les données de démonstration si `SEED_DEMO_DATA=true`. Strapi refuse de démarrer si une variable obligatoire manque ou vaut encore `change-me`.

## 3. Comptes de démonstration

Tous les lecteurs de démonstration partagent le mot de passe **`Password123!`**.

| Identifiant                                             | Rôle                                   |
| ------------------------------------------------------- | -------------------------------------- |
| `alice`, `bob`                                          | lecteurs, utilisés par les tests       |
| `LaRedaction`, `Vincent_ETF`, `PapyBoursier`, 15 autres | auteurs des discussions de la maquette |

Adresse e-mail de chaque compte : `<identifiant en minuscules>@demo.lerevenu.test`.

Vous pouvez aussi créer votre propre compte sur `/register` (nom d'utilisateur, e-mail, mot de passe de 8 caractères minimum), ou passer par Google si les identifiants Google sont renseignés (voir § 2).

## 4. Ce que fait l'application

| Fonction                                                                       | État                       |
| ------------------------------------------------------------------------------ | -------------------------- |
| Liste des discussions : filtre par espace, tri par date, recherche, pagination | ✔ `/discussions`           |
| Détail d'une discussion et ses réponses, URL propre par slug                   | backend prêt, page à venir |
| Connexion, inscription, Google, déconnexion, menu du compte                    | ✔ `/login`, `/register`    |
| Création d'une discussion (titre ≥ 10 caractères, contenu, espace, type)       | backend prêt, page à venir |
| Réponse à une discussion                                                       | backend prêt, page à venir |
| Interface en français et en anglais, menu de langue, thème clair / sombre      | ✔                          |

L'avancement détaillé est dans [`docs/plans/`](docs/plans/README.md).

## 5. Architecture

```
Navigateur ──(JSON + cookie httpOnly)──► Route Handlers Next.js ──(JWT Bearer)──► Strapi ──► PostgreSQL / SQLite
    ▲                                        (BFF, validation zod)                   ▲
    └──────── HTML (Server Components) ◄──── couche d'accès aux données ─────────────┘
```

- **Strapi** est la seule source de vérité : schémas, validation, permissions, règles métier.
- **Next.js** ne parle jamais à la base de données. Les composants serveur lisent Strapi via une couche d'accès typée ; les composants client passent par des Route Handlers (`/api/*`). Aucune Server Action.
- Le JWT Strapi vit dans un cookie `httpOnly` posé par Next.js ; il n'atteint jamais le JavaScript du navigateur et l'URL de Strapi n'est pas exposée.
- Diagrammes et flux : [`docs/architecture.md`](docs/architecture.md). Modèle de données : [`docs/data-model.md`](docs/data-model.md).

## 6. Modèle de sécurité

| Règle du cahier des charges                 | Où elle est appliquée                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| Publication interdite sans authentification | Rôle Public sans permission `create` → **403**                                      |
| Impossible de publier au nom d'un autre     | Le contrôleur ignore tout `author` envoyé et impose l'utilisateur de la session     |
| Titre ≥ 10 caractères, contenu obligatoire  | `schema.json` Strapi, appliqué même en appelant l'API directement → **400**         |
| Modification réservée à l'auteur            | Politique `is-owner` sur `update` et `delete` → **403**                             |
| Adresse e-mail jamais exposée               | Population limitée à `username` ; aucun rôle n'a `user.find`                        |
| Draft & Publish désactivé                   | Sinon Strapi masque les nouvelles entrées et saute la validation sur les brouillons |

| Session | Cookie `lr_session` httpOnly, SameSite=Lax, 7 jours, écrit par Next.js ; le JWT Strapi n'apparaît dans aucune réponse |
| Écritures du BFF | JSON uniquement (**415**) et même origine (`Sec-Fetch-Site` / `Origin`, **403**) |
| Connexion Google | Fournisseur Strapi, activé seulement si `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont définis ; échange final vérifié contre `/api/users/me` |

Les permissions sont créées par le code au démarrage (`apps/cms/src/bootstrap/ensure-permissions.ts`), pas à la main dans l'admin : un clone du dépôt donne le même état. Détails de la session et du flux Google : [ADR-0009](docs/adr/0009-session-cookie-and-google-login.md).

## 7. API

Base : `http://localhost:1337/api`. Format Strapi : `{ data, meta }`, erreurs `{ data: null, error: { status, name, message, details } }`.

| Méthode et chemin                             | Auth            | Rôle                                                   |
| --------------------------------------------- | --------------- | ------------------------------------------------------ |
| `GET /categories?locale=fr\|en`               | public          | espaces, dans la langue demandée                       |
| `GET /discussions?filters…&sort…&pagination…` | public          | liste paginée (10 par défaut, 50 max), tri `createdAt` |
| `GET /discussions/slug/:slug`                 | public          | détail avec réponses                                   |
| `POST /discussions`                           | Bearer          | création, auteur imposé par la session                 |
| `PUT` / `DELETE /discussions/:documentId`     | Bearer + auteur | modification, suppression (avec ses réponses)          |
| `POST /replies`                               | Bearer          | réponse, auteur imposé                                 |
| `PUT` / `DELETE /replies/:documentId`         | Bearer + auteur |                                                        |
| `POST /auth/local`                            | —               | connexion → `{ jwt, user }`                            |
| `POST /auth/local/register`                   | —               | inscription                                            |
| `GET /users/me`                               | Bearer          | profil courant                                         |

Exemple :

```bash
curl 'http://localhost:1337/api/discussions?filters[category][slug][$eq]=bourse&sort=createdAt:desc&pagination[pageSize]=5'
```

## 8. Tests

| Niveau               | Outil                                                     | Commande                             |
| -------------------- | --------------------------------------------------------- | ------------------------------------ |
| Backend, intégration | Vitest + supertest, Strapi sur PostgreSQL `lerevenu_test` | `pnpm --filter cms test:integration` |
| Frontend, unitaire   | Vitest + Testing Library                                  | `pnpm --filter web test`             |
| Bout en bout         | Playwright, projets `fr` et `en`                          | `pnpm --filter web test:e2e`         |

Les quatre tests demandés par le cahier des charges (validation d'une discussion, refus d'une publication non authentifiée, protection contre l'usurpation d'auteur, affichage des discussions) sont dans `apps/cms/tests/`, avec les droits d'auteur, les réponses, la connexion et les catégories bilingues : 8 fichiers, 41 tests, environ 15 s.

Comment tournent les tests backend :

1. `tsc` compile l'application dans `.tmp/test-dist` (jamais dans `dist/`, donc sans conflit avec un `strapi develop` en cours).
2. Le `globalSetup` de Vitest vide le schéma de `lerevenu_test` (refus si le nom ne finit pas par `_test`), démarre **un seul Strapi** sur le port 1338 avec `NODE_ENV=test`, laisse le seed charger les données de démonstration, connecte `alice` et `bob`.
3. Les fichiers s'exécutent l'un après l'autre et parlent à cette instance en HTTP (supertest) : mêmes réponses que celles reçues par le front.

Prérequis : PostgreSQL démarré (`docker compose up -d db` crée `lerevenu_test`), `apps/cms/.env` renseigné. Variable `DATABASE_TEST_NAME` pour changer le nom de la base de test.

Tests frontend (`apps/web`, Vitest + Testing Library, colocalisés `*.test.ts(x)`, 32 tests) : le client Strapi (chaîne de requête, enveloppe d'erreur, réponse inattendue, serveur injoignable), le schéma des filtres et la correspondance URL ↔ état (valeurs par défaut, page invalide, `clearOnDefault`), la carte de discussion (cinq champs du cahier des charges, lien vers le détail, ni e-mail ni id numérique), la pagination (page courante, filtres conservés, bornes), le handler `GET /api/discussions` (422 sur un tri inconnu, locale transmise, 503 sans fuite du message Strapi), le menu de langue et le bouton de thème, la parité des clés fr / en.

## 9. Qualité et CI/CD

- **Branches** : `main` (production, protégée), `development` (intégration, protégée), `feature/<nom-court>`. Chaque fonctionnalité commence par un plan revu dans `docs/plans/`.
- **Hooks Git** (husky) : Node 24 obligatoire, commits interdits sur les branches protégées, lint-staged, commitlint (Conventional Commits), vérifications avant push.
- **`pnpm verify`** : clone propre, installation gelée, lint, format, commitlint, type-check, build, tests. Rien n'est poussé en rouge.
- **GitHub Actions** : lint et format, type-check, tests unitaires, tests d'intégration Strapi sur un service PostgreSQL (`apps/cms/.env.ci`), build, sur chaque PR vers `development` et `main`.
- Détails : [`CONTRIBUTING.md`](CONTRIBUTING.md).

## 10. Structure du dépôt

```
apps/
  cms/      Strapi 5 : config/, src/api/{category,discussion,reply}, src/bootstrap/, src/seed/, tests/
  web/      Next.js 16 : src/app/[locale]/, src/features/, src/components/, src/lib/, messages/
packages/
  eslint-config/      configurations ESLint partagées
  typescript-config/  configurations TypeScript partagées
docs/
  architecture.md · data-model.md · adr/ · plans/
docker-compose.yml · turbo.json · pnpm-workspace.yaml
```

## 11. Choix d'architecture

Chaque décision structurante est consignée dans un ADR (Architecture Decision Record) : [`docs/adr/`](docs/adr/README.md).

| ADR  | Décision                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| 0001 | Strapi Users & Permissions comme unique fournisseur d'identité ; better-auth et Drizzle évalués puis écartés |
| 0002 | Route Handlers (BFF) plutôt que Server Actions                                                               |
| 0003 | Cache Components, couche d'accès aux données, TanStack Query                                                 |
| 0004 | Monorepo pnpm + Turborepo                                                                                    |
| 0005 | DTO zod comme source de types du frontend                                                                    |
| 0006 | Invalidation du cache par tags et webhook Strapi                                                             |
| 0007 | Français et anglais dès le départ avec next-intl                                                             |

## 12. Évolutions

Onglets de la maquette (Tendances, Pour vous, Sans réponse), vue compacte, sujets épinglés, compteurs « Utile » et vues, recherche insensible aux accents (`unaccent`), votes « Utile » et meilleure réponse, recherche plein texte PostgreSQL, profil utilisateur, génération OpenAPI typée depuis Strapi, `jwtManagement: 'refresh'`, déploiement : Next.js sur Vercel, Strapi sur Railway ou Strapi Cloud.

---

Les outils d'assistance au développement, y compris l'IA, ont été utilisés pour la recherche et l'accélération ; chaque ligne livrée est comprise et défendable en revue.
