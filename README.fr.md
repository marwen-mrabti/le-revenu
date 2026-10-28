# Communauté Le Revenu

🇬🇧 [English version](README.md)

Espace communautaire des lecteurs du Revenu : poser une question d'argent, partager une expérience, répondre aux autres membres.

Test technique développeur full stack · Next.js 16 · Strapi 5 · PostgreSQL (ou SQLite sans rien installer).

---

## Sommaire

1. [Lancer le projet](#1-lancer-le-projet) : [A. Une commande avec Docker](#a-une-commande-avec-docker) · [B. Deux minutes avec Node](#b-deux-minutes-avec-node-sqlite-sans-docker) · [C. Installation complète](#c-installation-complète-de-développement-docker--postgresql--boîte-mail)
2. [Se connecter et essayer](#2-se-connecter-et-essayer)
3. [Ce que fait l'application](#3-ce-que-fait-lapplication)
4. [Architecture](#4-architecture)
5. [Modèle de sécurité](#5-modèle-de-sécurité)
6. [API](#6-api)
7. [Tests](#7-tests)
8. [Qualité et CI/CD](#8-qualité-et-cicd)
9. [Structure du dépôt](#9-structure-du-dépôt)
10. [Choix d'architecture](#10-choix-darchitecture)
11. [Problèmes fréquents](#11-problèmes-fréquents)
12. [Évolutions](#12-évolutions)

## 1. Lancer le projet

Trois façons, de la plus légère à la plus complète. Choisissez-en une ; chacune se termine avec le site sur http://localhost:3000 et les données de démonstration chargées.

| Chemin                                    | Il vous faut                                   | Idéal pour                                                       |
| ----------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| A. Une commande avec Docker               | Docker Desktop (ou Docker Engine + Compose v2) | Essayer le projet sans installer Node                            |
| B. Deux minutes avec Node                 | Node 24, pnpm 10                               | Lire le code et le lancer en mode développement                  |
| C. Installation complète de développement | Node 24, pnpm 10, Docker                       | Travailler sur le projet avec PostgreSQL et la boîte mail locale |

### A. Une commande avec Docker

```bash
git clone https://github.com/marwen-mrabti/le-revenu.git
cd le-revenu
docker compose --profile apps up --build
```

Le premier lancement construit deux images et prend quelques minutes. Attendu à la fin : quatre services `healthy`, puis :

- http://localhost:3000 — le site, avec 18 discussions de démonstration.
- http://localhost:1337/admin — l'admin Strapi ; créez le compte administrateur à la première visite.
- http://localhost:8025 — la boîte mail : chaque mail envoyé par le site (confirmation d'inscription, réinitialisation du mot de passe) arrive ici.

Aucun fichier à créer : le fichier Compose porte des valeurs de démonstration pour chaque secret. Elles sont publiques dans ce dépôt, donc réservées à un lancement local ; pour utiliser les vôtres, copiez `.env.example` vers `.env` et renseignez-y les mêmes noms (le fichier explique chacun).

Dans le réseau Docker, les applications se parlent par leurs noms de service (`STRAPI_URL=http://cms:1337`, `WEBHOOK_URL=http://web:3000`) ; les mails, les callbacks de connexion et le navigateur gardent `localhost`. Le développement reste sur pnpm (chemins B et C) : Docker est la forme de production, et les mêmes images servent au déploiement.

Arrêt avec `Ctrl+C` ; suppression de tout, base comprise, avec `docker compose --profile apps down -v`.

### B. Deux minutes avec Node (SQLite, sans Docker)

Prérequis : Node 24 (`.nvmrc`) et pnpm 10 (`corepack enable` suffit, la version est fixée dans `package.json`). Aucun fichier `.env` à créer dans ce mode.

1. Installer.

   ```bash
   git clone https://github.com/marwen-mrabti/le-revenu.git
   cd le-revenu
   pnpm install
   ```

2. Démarrer Strapi sur la base SQLite fournie (terminal 1). Attendu après quelques secondes : `Strapi started successfully`, et http://localhost:1337/api/categories répond du JSON.

   ```bash
   pnpm --filter cms dev:sqlite
   ```

3. Démarrer Next.js (terminal 2). Attendu : `Ready`, puis http://localhost:3000/discussions affiche la liste des discussions.

   ```bash
   pnpm --filter web dev
   ```

Ce qui se passe : Strapi lit `apps/cms/.env.sqlite` (clés de démonstration, jamais pour la production) et copie `apps/cms/database/demo.sqlite` dans `.tmp/` à chaque lancement, le fichier versionné n'est jamais modifié. Next.js a des valeurs par défaut de développement (`apps/web/src/config/env.ts`) accordées avec ce fichier. Pas de messagerie dans ce mode : l'inscription ne demande pas de confirmation, le compte est actif tout de suite, et les mails de réinitialisation sont jetés : le journal de Strapi affiche un avertissement `email: discarded …` par mail, avec le destinataire et l'objet.

### C. Installation complète de développement (Docker + PostgreSQL + boîte mail)

Prérequis : Node 24, pnpm 10, Docker avec Compose v2.

1. Les fichiers d'environnement. Strapi refuse de démarrer si une variable obligatoire manque ou vaut encore `change-me`.

   ```bash
   cp .env.example .env                       # PostgreSQL pour docker-compose
   cp apps/cms/.env.example apps/cms/.env     # puis remplacer chaque "change-me" : openssl rand -base64 32
   cp apps/web/.env.example apps/web/.env     # facultatif ; REVALIDATE_SECRET doit être le même que côté cms
   ```

2. Installer et démarrer la base et la boîte mail. Attendu : `docker compose ps` montre `lerevenu-db` et `lerevenu-mail` en `healthy`.

   ```bash
   pnpm install
   docker compose up -d db mailpit            # PostgreSQL 16 (lerevenu, lerevenu_test) et Mailpit
   ```

3. Démarrer les deux applications. Attendu : Strapi sur http://localhost:1337, Next.js sur http://localhost:3000.

   ```bash
   pnpm dev                                   # Turborepo lance cms et web
   ```

`WEB_URL` et `PUBLIC_URL` sont les adresses publiques des deux applications : chaque lien de mail et chaque callback de connexion en découle, rien n'est codé en dur. Strapi refuse de démarrer sans elles.

Au premier démarrage, Strapi crée les tables, les deux locales (fr par défaut, en), les permissions des rôles, les réglages de messagerie, puis les données de démonstration si `SEED_DEMO_DATA=true`. Un second démarrage ne duplique rien.

**Mails.** Confirmation à l'inscription et réinitialisation du mot de passe arrivent dans Mailpit : ouvrir http://localhost:8025 pour les lire. `apps/cms/.env.example` pointe déjà `SMTP_HOST` dessus. Avec `SMTP_HOST` vide, les mails sont jetés, l'inscription ne demande pas de confirmation, et Strapi avertit au démarrage puis une fois par mail jeté. Pour de vraies boîtes mail, deux recettes, sans changement de code :

- **Gmail** (livre à tout le monde, environ 500 mails par jour) : activer la validation en deux étapes, créer un mot de passe d'application sur https://myaccount.google.com/apppasswords, puis :

  ```bash
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=465
  SMTP_SECURE=true
  SMTP_USER=vous@gmail.com
  SMTP_PASS=le16caracteresdumotdepasse                 # sans espaces
  EMAIL_FROM="Communauté Le Revenu <vous@gmail.com>"    # Gmail remplace tout autre expéditeur par votre adresse
  ```

- **Resend** (gratuit) : créer une clé API sur https://resend.com/api-keys, puis `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER=resend`, `SMTP_PASS=re_…`, `EMAIL_FROM="Communauté Le Revenu <onboarding@resend.dev>"`. Tant qu'aucun domaine n'est vérifié dans Resend, seule l'adresse du compte Resend reçoit les mails ; les autres destinataires sont refusés (le handler mot de passe oublié répond alors 502).

Tout autre relais SMTP (Brevo, Postmark) fonctionne de la même façon : cinq variables.

**Connexion Google, facultative.** Créer un client OAuth « Web » dans Google Cloud avec l'URI de redirection `http://localhost:1337/api/connect/google/callback`, mettre `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` dans `apps/cms/.env` et `NEXT_PUBLIC_GOOGLE_LOGIN=true` dans `apps/web/.env`, redémarrer. Sans ces valeurs, le bouton Google n'apparaît pas.

## 2. Se connecter et essayer

Tous les lecteurs de démonstration partagent le mot de passe **`Password123!`**.

| Identifiant                                             | Rôle                                   |
| ------------------------------------------------------- | -------------------------------------- |
| `alice`, `bob`                                          | lecteurs, utilisés par les tests       |
| `LaRedaction`, `Vincent_ETF`, `PapyBoursier`, 15 autres | auteurs des discussions de la maquette |

Adresse e-mail de chaque compte : `<identifiant en minuscules>@demo.lerevenu.test`. Vous pouvez aussi créer votre propre compte sur `/register` ; avec une boîte mail lancée (chemins A et C), confirmez l'adresse depuis le mail, puis connectez-vous. Ou passez par Google si les identifiants Google sont renseignés.

Un tour en cinq minutes :

1. `/discussions` : filtrer par espace, trier, chercher, paginer ; tout reste dans l'URL. Changez de langue et de thème dans l'en-tête.
2. Ouvrez une discussion : les réponses, la pastille « Auteur » sur les réponses de l'auteur. Connectez-vous en `alice`, répondez, modifiez puis supprimez votre réponse.
3. « Publier » dans l'en-tête : créez une discussion (titre de 10 caractères minimum, espace, type). Vous arrivez sur sa page ; « Modifier · Supprimer » vous appartiennent.
4. Menu du compte → « Mon compte » : nom affiché, mot de passe, suppression du compte. Déconnectez-vous, « Mot de passe oublié ? », lisez le mail sur http://localhost:8025.
5. Essayez `/discussions/nope` pour la page 404, et `/dev/boom` (développement seulement) pour la page 500.

## 3. Ce que fait l'application

| Fonction                                                                                 | État                    |
| ---------------------------------------------------------------------------------------- | ----------------------- |
| Liste des discussions : filtre par espace, tri par date, recherche, pagination           | ✔ `/discussions`        |
| Détail d'une discussion et ses réponses, URL propre par slug                             | ✔ `/discussions/<slug>` |
| Réponse à une discussion, modification et suppression de ses réponses et discussions     | ✔ depuis la page détail |
| Création d'une discussion (titre ≥ 10 caractères, contenu, espace, type)                 | ✔ `/discussions/new`    |
| Connexion, inscription avec confirmation par e-mail, Google, déconnexion, menu du compte | ✔ `/login`, `/register` |
| Mot de passe oublié / réinitialisation par e-mail                                        | ✔ `/forgot-password`    |
| Page compte : nom affiché, nom d'utilisateur, mot de passe, suppression                  | ✔ `/account`            |
| Premier mot de passe d'un compte Google, depuis la page compte                           | ✔ `/account`            |
| Nom et photo Google ; connexion Google liée à un compte avec mot de passe                | ✔                       |
| Interface en français et en anglais, menu de langue, thème clair / sombre                | ✔                       |
| Pages 404 et 500 personnalisées (en-tête conservé, recherche, espaces, code d'incident)  | ✔                       |
| Docker Compose pour toute la pile                                                        | ✔ chemin A              |

Non réalisé, par choix : votes « Utile » et meilleure réponse, page de profil public (bonus du cahier des charges, listés dans les évolutions). L'avancement détaillé est dans [`docs/plans/`](docs/plans/README.md).

## 4. Architecture

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

## 5. Modèle de sécurité

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

## 6. API

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

## 7. Tests

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

## 8. Qualité et CI/CD

- **Branches** : `main` (production, protégée), `development` (intégration, protégée), `feature/<nom-court>`. Chaque fonctionnalité commence par un plan revu dans `docs/plans/`.
- **Hooks Git** (husky) : Node 24 obligatoire, commits interdits sur les branches protégées, lint-staged, commitlint (Conventional Commits), vérifications avant push.
- **`pnpm verify`** : clone propre, installation gelée, lint, format, commitlint, type-check, build, tests. Rien n'est poussé en rouge.
- **GitHub Actions** : lint et format, type-check, tests unitaires, tests d'intégration Strapi sur un service PostgreSQL (`apps/cms/.env.ci`), build, les deux images Docker, sur chaque PR vers `development` et `main`.
- Détails : [`CONTRIBUTING.md`](CONTRIBUTING.md).

## 9. Structure du dépôt

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
apps/cms/Dockerfile · apps/web/Dockerfile · docker-compose.yml (db, mailpit, et cms + web derrière le profil `apps`) · turbo.json · pnpm-workspace.yaml
```

## 10. Choix d'architecture

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

## 11. Problèmes fréquents

| Symptôme                                            | Cause et remède                                                                                                                                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install` refuse la version de Node            | Node 24 requis : `nvm use` (lit `.nvmrc`) ou `mise use`                                                                                                                                               |
| `pnpm: command not found`                           | `corepack enable`, puis relancer                                                                                                                                                                      |
| `EADDRINUSE 1337` ou `3000`                         | Un autre Strapi ou Next tourne déjà ; ne jamais lancer deux `strapi develop` dans le même dossier                                                                                                     |
| Strapi : `Environment check failed`                 | Une variable manque ou vaut `change-me` dans `apps/cms/.env` ; la liste est dans le message                                                                                                           |
| Next : `Invalid environment variables` (production) | `STRAPI_URL` et `REVALIDATE_SECRET` sont obligatoires en production                                                                                                                                   |
| `connect ECONNREFUSED 5432`                         | Docker non démarré : `docker compose up -d db`, puis `docker compose ps`                                                                                                                              |
| Connexion : « Trop de tentatives »                  | Strapi limite à 10 connexions par minute et par IP ; attendre une minute                                                                                                                              |
| Google : « access blocked »                         | Application Google en mode test : ajouter votre adresse dans Google Auth Platform → Audience → Test users                                                                                             |
| Aucun mail de confirmation ou de réinitialisation   | Mailpit non lancé (`docker compose up -d mailpit`) ou `SMTP_HOST` vide ; lire les mails sur http://localhost:8025. Mailpit ne livre jamais une vraie boîte : utiliser Gmail ou Resend pour cela (§ 1) |
| Resend : `550 You can only send testing emails…`    | Offre gratuite sans domaine vérifié : seule l'adresse du compte Resend reçoit les mails                                                                                                               |
| Connexion : « adresse pas encore confirmée »        | Cliquer le lien du mail de confirmation, ou « Renvoyer le lien » ; seul le mail le plus récent est valable                                                                                            |
| Tests d'intégration : `Refusing to reset`           | La base visée ne finit pas par `_test` ; vérifier `DATABASE_TEST_NAME`                                                                                                                                |

## 12. Évolutions

Onglets de la maquette (Tendances, Pour vous, Sans réponse), vue compacte, sujets épinglés, compteurs « Utile » et vues, recherche insensible aux accents (`unaccent`), votes « Utile » et meilleure réponse, recherche plein texte PostgreSQL, profil public des lecteurs, changement d'e-mail avec confirmation, page aux couleurs du site pour un lien de confirmation expiré, génération OpenAPI typée depuis Strapi, `jwtManagement: 'refresh'`, déploiement : Next.js sur Vercel, Strapi sur Railway ou Strapi Cloud.

---

Les outils d'assistance au développement, y compris l'IA, ont été utilisés pour la recherche et l'accélération ; chaque ligne livrée est comprise et défendable en revue.
