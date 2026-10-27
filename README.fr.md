# Communauté Le Revenu

🇬🇧 [English version](README.md)

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
12. [Problèmes fréquents](#12-problèmes-fréquents)
13. [Évolutions](#13-évolutions)

---

## 1. Démarrage en 2 minutes (SQLite, sans Docker)

Prérequis : Node 24 (fichier `.nvmrc`) et pnpm 10 (`corepack enable` suffit, la version est fixée dans `package.json`). Aucun fichier `.env` à créer dans ce mode.

1. Cloner et installer.

   ```bash
   git clone git@github.com:marwen-mrabti/le-revenu.git && cd le-revenu
   pnpm install
   ```

2. Lancer Strapi sur la base SQLite livrée (terminal 1). Attendu après quelques secondes : `Strapi started successfully` et http://localhost:1337/api/categories qui répond du JSON.

   ```bash
   pnpm --filter cms dev:sqlite
   ```

3. Lancer Next.js (terminal 2). Attendu : `Ready` puis http://localhost:3000/discussions affiche la liste des discussions.

   ```bash
   pnpm --filter web dev
   ```

4. Se connecter avec `alice` / `Password123!` (section 3), ou créer un compte sur `/register` (pas de messagerie dans ce mode : le compte est actif tout de suite).

Ce qui se passe : Strapi lit `apps/cms/.env.sqlite` (clés de démonstration, jamais pour la production) et copie `apps/cms/database/demo.sqlite` dans `.tmp/` à chaque lancement, le fichier versionné n'est jamais modifié. Next.js a des valeurs par défaut de développement (`apps/web/src/config/env.ts`) accordées avec ce fichier. Le panneau d'administration http://localhost:1337/admin demande de créer un compte administrateur à la première visite.

## 2. Démarrage complet (Docker + PostgreSQL)

Prérequis : Node 24, pnpm 10, Docker avec Compose v2.

1. Les fichiers d'environnement. Strapi refuse de démarrer si une variable obligatoire manque ou vaut encore `change-me`.

   ```bash
   cp .env.example .env                       # PostgreSQL pour docker-compose
   cp apps/cms/.env.example apps/cms/.env     # puis remplacer chaque "change-me" : openssl rand -base64 32
   cp apps/web/.env.example apps/web/.env     # facultatif ; REVALIDATE_SECRET doit être le même que côté cms
   ```

2. Installer et démarrer la base. Attendu : `docker compose ps` montre `lerevenu-db` en `healthy`.

   ```bash
   pnpm install
   docker compose up -d db mailpit            # PostgreSQL 16 (lerevenu, lerevenu_test) et Mailpit, la boîte mail de développement
   ```

3. Démarrer les deux applications. Attendu : Strapi sur http://localhost:1337, Next.js sur http://localhost:3000.

   ```bash
   pnpm dev                                   # Turborepo lance cms et web
   ```

`WEB_URL` et `PUBLIC_URL` sont les adresses publiques des deux applications : chaque lien de mail et chaque callback de connexion en découle, rien n'est codé en dur. Strapi refuse de démarrer sans elles.

Au premier démarrage, Strapi crée les tables, les deux locales (fr par défaut, en), les permissions des rôles, les réglages de messagerie, puis les données de démonstration si `SEED_DEMO_DATA=true`. Un second démarrage ne duplique rien.

Les mails (confirmation à l'inscription, réinitialisation du mot de passe) arrivent dans Mailpit : ouvrir http://localhost:8025 pour les lire. Leurs liens arrivent sur le site dans la langue du lecteur. Les mails sont des composants React Email dans `apps/cms/src/emails/` (un gabarit commun, sans image ni police web), rendus en HTML au démarrage et stockés là où le plugin Users & Permissions de Strapi lit ses modèles ; modifier le texte là, puis redémarrer. `apps/cms/.env.example` pointe déjà `SMTP_HOST` dessus. Avec `SMTP_HOST` vide, les mails sont jetés, l'inscription ne demande pas de confirmation et Strapi affiche un avertissement au démarrage.

Vraies boîtes mail, avec Resend (gratuit, sans changement de code) : créer une clé API sur https://resend.com/api-keys, puis dans `apps/cms/.env` :

```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_…                                         # la clé API
EMAIL_FROM="Communauté Le Revenu <onboarding@resend.dev>"
```

Tant qu'aucun domaine n'est vérifié dans Resend, seule l'adresse du compte Resend reçoit les mails et l'expéditeur doit rester `onboarding@resend.dev` ; les autres destinataires sont refusés (le handler mot de passe oublié répond alors 502). En production, vérifier un domaine et mettre une adresse de ce domaine dans `EMAIL_FROM`.

Avec Gmail (livre à tout le monde, environ 500 mails par jour) : activer la validation en deux étapes, créer un mot de passe d'application sur https://myaccount.google.com/apppasswords, puis :

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=vous@gmail.com
SMTP_PASS=le16caracteresdumotdepasse                 # sans espaces
EMAIL_FROM="Communauté Le Revenu <vous@gmail.com>"    # Gmail remplace tout autre expéditeur par votre adresse
```

Tout autre relais SMTP (Brevo, Postmark) fonctionne de la même façon : cinq variables, aucun changement de code.

Connexion Google, facultative : créer un client OAuth « Web » dans Google Cloud avec l'URI de redirection `http://localhost:1337/api/connect/google/callback`, mettre `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` dans `apps/cms/.env` et `NEXT_PUBLIC_GOOGLE_LOGIN=true` dans `apps/web/.env`, redémarrer. Sans ces valeurs, le bouton Google n'apparaît pas.

## 3. Comptes de démonstration

Tous les lecteurs de démonstration partagent le mot de passe **`Password123!`**.

| Identifiant                                             | Rôle                                   |
| ------------------------------------------------------- | -------------------------------------- |
| `alice`, `bob`                                          | lecteurs, utilisés par les tests       |
| `LaRedaction`, `Vincent_ETF`, `PapyBoursier`, 15 autres | auteurs des discussions de la maquette |

Adresse e-mail de chaque compte : `<identifiant en minuscules>@demo.lerevenu.test`.

Vous pouvez aussi créer votre propre compte sur `/register` (nom d'utilisateur, e-mail, mot de passe de 8 caractères minimum) : avec Mailpit lancé, confirmez l'adresse depuis le mail sur http://localhost:8025, puis connectez-vous. Ou passez par Google si les identifiants Google sont renseignés (voir § 2).

## 4. Ce que fait l'application

| Fonction                                                                                 | État                    |
| ---------------------------------------------------------------------------------------- | ----------------------- |
| Liste des discussions : filtre par espace, tri par date, recherche, pagination           | ✔ `/discussions`        |
| Détail d'une discussion et ses réponses, URL propre par slug                             | ✔ `/discussions/<slug>` |
| Connexion, inscription avec confirmation par e-mail, Google, déconnexion, menu du compte | ✔ `/login`, `/register` |
| Mot de passe oublié / réinitialisation par e-mail                                        | ✔ `/forgot-password`    |
| Page compte : nom affiché, nom d'utilisateur, mot de passe, suppression                  | ✔ `/account`            |
| Premier mot de passe d'un compte Google, depuis la page compte                           | ✔ `/account`            |
| Nom et photo Google ; connexion Google liée à un compte avec mot de passe                | ✔                       |
| Création d'une discussion (titre ≥ 10 caractères, contenu, espace, type)                 | ✔ `/discussions/new`    |
| Réponse à une discussion, modification et suppression de ses réponses et discussions     | ✔ depuis la page détail |
| Interface en français et en anglais, menu de langue, thème clair / sombre                | ✔                       |
| Pages 404 et 500 personnalisées (en-tête conservé, recherche, espaces, code d'incident)  | ✔                       |

L'avancement détaillé est dans [`docs/plans/`](docs/plans/README.md).

## 5. Architecture

```
Navigateur ──(JSON + cookie httpOnly)──► Route Handlers Next.js ──(JWT Bearer)──► Strapi ──► PostgreSQL / SQLite
    ▲                                        (BFF, validation zod)                   ▲
    └──────── HTML (Server Components) ◄──── couche d'accès aux données ─────────────┘
```

- **Strapi** est la seule source de vérité : schémas, validation, permissions, règles métier.
- **Next.js** ne parle jamais à la base de données. Les composants serveur lisent Strapi via une couche d'accès typée ; les composants client passent par des Route Handlers (`/api/*`). Aucune Server Action.
- La page d'une discussion est mise en cache (`'use cache'`, quelques heures) et étiquetée par collection et par entrée ; les handlers de réponse et de modification expirent l'entrée aussitôt, et un webhook Strapi (`POST /api/revalidate`, enregistré au démarrage) l'expire après une modification dans l'admin (ADR-0006).
- Le JWT Strapi vit dans un cookie `httpOnly` posé par Next.js ; il n'atteint jamais le JavaScript du navigateur et l'URL de Strapi n'est pas exposée (une exception documentée pour le flux Google, ADR-0009).
- Diagrammes et flux : [`docs/architecture.md`](docs/architecture.md). Modèle de données : [`docs/data-model.md`](docs/data-model.md).

## 6. Modèle de sécurité

| Règle                                       | Où elle est appliquée                                                                                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Publication interdite sans authentification | Rôle Public sans permission `create` → **403**                                                                                                       |
| Impossible de publier au nom d'un autre     | Le contrôleur ignore tout `author` envoyé et impose l'utilisateur de la session                                                                      |
| Titre ≥ 10 caractères, contenu obligatoire  | `schema.json` Strapi, appliqué même en appelant l'API directement → **400**                                                                          |
| Modification réservée à l'auteur            | Politique `is-owner` sur `update` et `delete` → **403**                                                                                              |
| Adresse e-mail jamais exposée               | Population limitée à `username` ; aucun rôle n'a `user.find`                                                                                         |
| Draft & Publish désactivé                   | Sinon Strapi masque les nouvelles entrées et saute la validation sur les brouillons                                                                  |
| Session                                     | Cookie `lr_session` httpOnly, SameSite=Lax, 7 jours, écrit par Next.js ; le JWT Strapi n'apparaît dans aucune réponse                                |
| Écritures du BFF                            | JSON uniquement (**415**) et même origine (`Sec-Fetch-Site` / `Origin`, **403**)                                                                     |
| Connexion Google                            | Fournisseur Strapi, activé seulement si `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont définis ; échange final vérifié contre `/api/users/me`     |
| Confirmation de l'e-mail                    | Exigée quand une messagerie est configurée ; la connexion répond **403** `EMAIL_NOT_CONFIRMED` tant que le lien du mail n'a pas servi                |
| Mot de passe oublié                         | Toujours **200**, pas d'énumération des comptes ; code à usage unique, le nouveau mot de passe connecte ; code déjà utilisé → **400** `INVALID_CODE` |
| Son propre compte seulement                 | Politique `is-self` sur `PUT` / `DELETE /users/:id` : son id, `username` et `displayName` seulement ; e-mail, rôle, confirmed, blocked intouchables  |

Les permissions sont créées par le code au démarrage (`apps/cms/src/bootstrap/ensure-permissions.ts`), pas à la main dans l'admin : un clone du dépôt donne le même état. Session et flux Google : [ADR-0009](docs/adr/0009-session-cookie-and-google-login.md) ; messagerie, confirmation, compte et liaison Google : [ADR-0010](docs/adr/0010-mailer-confirmation-google-linking.md).

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
| `POST /auth/local/register`                   | —               | inscription ; en attente de confirmation si messagerie |
| `POST /auth/forgot-password`                  | —               | mail de réinitialisation, toujours 200                 |
| `POST /auth/reset-password`                   | —               | code + nouveau mot de passe → `{ jwt, user }`          |
| `POST /auth/send-email-confirmation`          | —               | renvoi du mail de confirmation                         |
| `POST /auth/change-password`                  | Bearer          | mot de passe actuel + nouveau → nouveau `jwt`          |
| `GET /auth/password-status`                   | Bearer          | `{ hasPassword }`                                      |
| `POST /auth/set-password`                     | Bearer          | premier mot de passe d'un compte Google, 409 ensuite   |
| `GET /users/me`                               | Bearer          | profil courant                                         |
| `PUT` / `DELETE /users/:id`                   | Bearer + soi    | ses `username` / `displayName`, sa propre suppression  |

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

Playwright a besoin d'un navigateur : `pnpm --filter web exec playwright install chromium` une fois. Par défaut il construit puis démarre l'application ; avec `E2E_BASE_URL=http://localhost:3000` il utilise le serveur de développement déjà lancé. Strapi limite les connexions à 10 par minute et par IP : ne lancez pas de connexions à la main pendant une exécution.

Les quatre tests demandés par le cahier des charges (validation d'une discussion, refus d'une publication non authentifiée, protection contre l'usurpation d'auteur, affichage des discussions) sont dans `apps/cms/tests/`, avec les droits d'auteur, les réponses, la connexion, les catégories bilingues, la confirmation d'e-mail, la réinitialisation du mot de passe, les règles du compte, le premier mot de passe d'un compte Google, les modèles de mail stockés et le webhook de revalidation : 14 fichiers, 56 tests, environ 20 s.

Comment tournent les tests backend :

1. `tsc` compile l'application dans `.tmp/test-dist` (jamais dans `dist/`, donc sans conflit avec un `strapi develop` en cours).
2. Le `globalSetup` de Vitest vide le schéma de `lerevenu_test` (refus si le nom ne finit pas par `_test`), démarre **un seul Strapi** sur le port 1338 avec `NODE_ENV=test`, laisse le seed charger les données de démonstration, connecte `alice` et `bob`.
3. Les fichiers s'exécutent l'un après l'autre et parlent à cette instance en HTTP (supertest) : mêmes réponses que celles reçues par le front.

Prérequis : PostgreSQL démarré (`docker compose up -d db` crée `lerevenu_test`), `apps/cms/.env` renseigné. Variable `DATABASE_TEST_NAME` pour changer le nom de la base de test.

Tests frontend (`apps/web`, Vitest + Testing Library, colocalisés `*.test.ts(x)`, 141 tests) : le client Strapi (chaîne de requête, enveloppe d'erreur, réponse inattendue, serveur injoignable), le schéma des filtres et la correspondance URL ↔ état (valeurs par défaut, page invalide, `clearOnDefault`), la carte de discussion (cinq champs du cahier des charges, lien vers le détail, ni e-mail ni id numérique), la pagination (page courante, filtres conservés, bornes), le handler `GET /api/discussions` (422 sur un tri inconnu, locale transmise, 503 sans fuite du message Strapi), le cookie de session et les gardes des requêtes, les handlers d'authentification, de compte, de réponse, de discussion et de revalidation, les deux pages d'arrivée des liens de mail (langue du lecteur), les formulaires de connexion, d'inscription, de mot de passe oublié, de réinitialisation, de profil, de mot de passe, de premier mot de passe et de suppression, le formulaire et la liste des réponses, le formulaire de création, les actions de l'auteur, les étiquettes de cache, la page de confirmation, le menu du compte, les îlots (erreur → repli → réessayer), la page 500, le menu de langue et le bouton de thème, la parité des clés fr / en.

Bout en bout (`apps/web/e2e`, Playwright) : connexion et confidentialité de la session, i18n, pages 404 / 500, résilience (un 503 sur la liste laisse la page intacte), le détail d'une discussion (depuis la liste, appel à connexion, alice répond, modifie et supprime, 404), la page de création (visiteur redirigé, règles, alice publie, atterrit, listée, supprime), et le cycle de vie du compte via l'API de Mailpit (inscription → mail → confirmation → connexion → profil → mot de passe oublié → réinitialisation → suppression). Le spec compte se saute lui-même si Mailpit n'est pas joignable, et il faut que Strapi envoie via Mailpit (`SMTP_HOST=localhost`) : avec un vrai relais comme l'offre gratuite de Resend, les adresses de test sont refusées et l'étape d'inscription échoue.

## 9. Qualité et CI/CD

- **Branches** : `main` (production, protégée), `development` (intégration, protégée), `feature/<nom-court>`. Chaque fonctionnalité commence par un plan revu dans `docs/plans/`.
- **Hooks Git** (husky) : Node 24 obligatoire, commits interdits sur les branches protégées, lint-staged, commitlint (Conventional Commits), vérifications avant push.
- **`pnpm verify`** : clone propre, installation gelée, lint, format, commitlint, type-check, build, tests. Rien n'est poussé en rouge.
- **GitHub Actions** : lint et format, type-check, tests unitaires, tests d'intégration Strapi sur un service PostgreSQL (`apps/cms/.env.ci`), build, sur chaque PR vers `development` et `main`.
- Détails : [`CONTRIBUTING.md`](CONTRIBUTING.md).

## 10. Structure du dépôt

```
apps/cms/                       Strapi 5 (TypeScript)
  config/                       serveur, base (postgres | sqlite), plugins, middlewares ; env/test/ pour les tests
  src/api/<type>/               category, discussion, reply : schema.json, controller, service, routes, constants
  src/api/discussion/utils/     slug.ts (slug côté serveur), presenter.ts (auteur réduit, aucun id numérique)
  src/policies/                 is-owner.ts (404 / 403 si l'appelant n'est pas l'auteur), is-self.ts (sa propre fiche seulement)
  src/extensions/users-permissions/  champs displayName et avatarUrl, liaison Google, is-self sur les routes utilisateur
  src/bootstrap/                vérification de l'env, index, locales, permissions, fournisseurs de connexion, profil Google, messagerie, webhook
  src/emails/                   modèles React Email (gabarit, confirmation, réinitialisation) rendus au démarrage
  src/seed/                     données de démonstration, chargées une fois sur base vide
  tests/                        tests d'intégration (un Strapi sur :1338, base lerevenu_test)
  database/demo.sqlite          base pré-remplie du mode zéro-configuration

apps/web/                       Next.js 16 (App Router, Cache Components)
  src/app/[locale]/             pages : (forum)/discussions, discussions/[slug], discussions/new, (auth)/login, register, forgot-password, reset-password,
                                verify-email, account, auth/google/callback, not-found.tsx, error.tsx ; loading.tsx par page
  src/app/api/                  Route Handlers (BFF) : auth/*, account, discussions, replies, categories, revalidate (webhook)
  src/features/<domaine>/       discussions, replies, categories, auth : schemas (zod), data (accès serveur),
                                api (queries et mutations TanStack), components, hooks
  src/components/               ui/ (shadcn), form/ (texte, mot de passe, zone de texte, sélection, cartes radio), shared/ (îlots, avatar, actions de l'auteur), layout/, theme/
  src/lib/                      strapi/ (client typé, seul lecteur de STRAPI_URL), api/ (client BFF, erreurs,
                                gardes), auth/ (cookie de session), i18n/ (langue d'un lien de mail), query/ (TanStack)
  src/i18n/                     routing, navigation, métadonnées des langues
  messages/                     fr.json, en.json (clés identiques, vérifiées par un test)
  e2e/                          Playwright

packages/eslint-config/         règles ESLint partagées (base, next, strapi)
packages/typescript-config/     tsconfig partagés
docs/                           architecture.md, data-model.md, adr/ (décisions), plans/ (un plan par branche),
                                mockups/ (maquettes HTML revues avant le code)
.github/workflows/ci.yml        lint, format, type-check, tests unitaires, tests Strapi sur PostgreSQL, build
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
| 0008 | Règles du forum appliquées dans Strapi, identifiants documentId uniquement, tests d'intégration en HTTP      |
| 0009 | Cookie de session posé par Next.js, connexion Google via le fournisseur Strapi                               |
| 0010 | Messagerie, confirmation de l'e-mail, page compte et liaison des comptes Google                              |

## 12. Problèmes fréquents

| Symptôme                                            | Cause et remède                                                                                                                                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install` refuse la version de Node            | Node 24 requis : `nvm use` (lit `.nvmrc`) ou `mise use`                                                                                                                                      |
| `pnpm: command not found`                           | `corepack enable`, puis relancer                                                                                                                                                             |
| `EADDRINUSE 1337` ou `3000`                         | Un autre Strapi ou Next tourne déjà ; ne jamais lancer deux `strapi develop` dans le même dossier                                                                                            |
| Strapi : `Environment check failed`                 | Une variable manque ou vaut `change-me` dans `apps/cms/.env` ; la liste est dans le message                                                                                                  |
| Next : `Invalid environment variables` (production) | `STRAPI_URL` et `REVALIDATE_SECRET` sont obligatoires en production                                                                                                                          |
| `connect ECONNREFUSED 5432`                         | Docker non démarré : `docker compose up -d db`, puis `docker compose ps`                                                                                                                     |
| Connexion : « Trop de tentatives »                  | Strapi limite à 10 connexions par minute et par IP ; attendre une minute                                                                                                                     |
| Google : « access blocked »                         | Application Google en mode test : ajouter votre adresse dans Google Auth Platform → Audience → Test users                                                                                    |
| Aucun mail de confirmation ou de réinitialisation   | Mailpit non lancé (`docker compose up -d mailpit`) ou `SMTP_HOST` vide ; lire les mails sur http://localhost:8025. Mailpit ne livre jamais une vraie boîte : utiliser Resend pour cela (§ 2) |
| Resend : `550 You can only send testing emails…`    | Offre gratuite sans domaine vérifié : seule l'adresse du compte Resend reçoit les mails                                                                                                      |
| Connexion : « adresse pas encore confirmée »        | Cliquer le lien du mail de confirmation, ou « Renvoyer le lien » ; seul le mail le plus récent est valable                                                                                   |
| Tests d'intégration : `Refusing to reset`           | La base visée ne finit pas par `_test` ; vérifier `DATABASE_TEST_NAME`                                                                                                                       |

## 13. Évolutions

Onglets de la maquette (Tendances, Pour vous, Sans réponse), vue compacte, sujets épinglés, compteurs « Utile » et vues, recherche insensible aux accents (`unaccent`), votes « Utile » et meilleure réponse, recherche plein texte PostgreSQL, profil public des lecteurs, changement d'e-mail avec confirmation, page aux couleurs du site pour un lien de confirmation expiré, génération OpenAPI typée depuis Strapi, `jwtManagement: 'refresh'`, déploiement : Next.js sur Vercel, Strapi sur Railway ou Strapi Cloud.

---

Les outils d'assistance au développement, y compris l'IA, ont été utilisés pour la recherche et l'accélération ; chaque ligne livrée est comprise et défendable en revue.
