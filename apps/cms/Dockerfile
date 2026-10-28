# Strapi production image. Build from the repository root:
#   docker build -f apps/cms/Dockerfile -t lerevenu-cms .
# Three stages: dependencies (native modules compiled once), build (admin + TypeScript), runtime (production files only).

FROM node:24-alpine AS base
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /repo

FROM base AS deps
# better-sqlite3 and sharp compile or download their binaries here, not in the runtime image.
RUN apk add --no-cache python3 make g++
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/cms/package.json apps/cms/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN pnpm install --frozen-lockfile --filter cms...

FROM deps AS build
COPY packages packages
COPY apps/cms apps/cms
ENV NODE_ENV=production
# Admin panel, then the server's TypeScript into dist/ (the layout `strapi start` expects).
RUN cd apps/cms && NODE_OPTIONS=--max-old-space-size=2048 pnpm exec strapi build \
  && pnpm exec tsc -p tsconfig.json \
  && pnpm --filter cms --prod deploy --legacy /out \
  # deploy packs like npm and skips git-ignored folders: the compiled server goes in by hand.
  && cp -r dist /out/dist \
  && rm -rf /out/tests /out/eslint.config.mjs /out/vitest.config.mts /out/Dockerfile /out/.env.example /out/.env.sqlite

FROM node:24-alpine AS runtime
RUN apk add --no-cache libc6-compat wget
ENV NODE_ENV=production HOST=0.0.0.0 PORT=1337
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 1337
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=10 \
  CMD wget -qO- http://127.0.0.1:1337/_health || exit 1
CMD ["node_modules/.bin/strapi", "start"]
